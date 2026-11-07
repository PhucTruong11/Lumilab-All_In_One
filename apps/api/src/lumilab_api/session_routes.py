"""Session-scoped draft run API backed by PostgreSQL."""

from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from hmac import compare_digest
from secrets import token_urlsafe
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import Connection, Engine, select
from sqlalchemy.exc import SQLAlchemyError

from lumilab_api.recompute import RecomputeInput, RuntimeDefinition, recompute
from lumilab_api.run_schema import runs, sessions
from lumilab_api.verifier import VerificationResult

bearer = HTTPBearer(auto_error=False)
PAGE_SIZE = 20


class SessionCredentials(BaseModel):
    session_id: UUID
    session_token: str
    expires_at: datetime


class SaveRun(RecomputeInput):
    lab_id: str = Field(min_length=1, max_length=32)
    idempotency_key: UUID


class StoredRun(BaseModel):
    run_id: UUID
    lab_id: str
    saved_at: datetime
    input: RecomputeInput
    result: VerificationResult


class RunPage(BaseModel):
    items: list[StoredRun]
    next_offset: int | None


def stored(row) -> StoredRun:
    return StoredRun(
        run_id=row.id, lab_id=row.lab_id, saved_at=row.created_at,
        input=row.input, result=row.result,
    )


def authorize(connection, session_id, credentials, *, lock=False):
    if credentials is None or len(credentials.credentials) > 128:
        raise HTTPException(401)
    statement = select(sessions).where(sessions.c.id == session_id)
    if lock:
        statement = statement.with_for_update()
    session = connection.execute(statement).one_or_none()
    digest = sha256(credentials.credentials.encode()).hexdigest()
    if (session is None or session.expires_at <= datetime.now(UTC)
            or not compare_digest(session.token_hash, digest)):
        raise HTTPException(401)

def session_router(engine: Engine | None, labs: dict[str, RuntimeDefinition]) -> APIRouter:
    router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])

    def transaction() -> Iterator[Connection]:
        if engine is None:
            raise HTTPException(503)
        try:
            with engine.begin() as connection:
                yield connection
        except SQLAlchemyError:
            raise HTTPException(503) from None

    # Function scope commits before the response is sent, so a failed commit cannot
    # be reported as a successful save.
    db = Depends(transaction, scope="function")


    @router.post("", response_model=SessionCredentials, status_code=201)
    def create_session(response: Response, connection: Connection = db):
        response.headers["Cache-Control"] = "no-store"
        token = token_urlsafe(32)
        session_id, expiry = uuid4(), datetime.now(UTC) + timedelta(days=7)
        connection.execute(sessions.insert().values(
            id=session_id, token_hash=sha256(token.encode()).hexdigest(), expires_at=expiry,
        ))
        return SessionCredentials(session_id=session_id, session_token=token, expires_at=expiry)

    @router.post("/{session_id}/runs", response_model=StoredRun, status_code=201)
    def save_run(
        session_id: UUID, payload: SaveRun, request: Request, response: Response,
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
        connection: Connection = db,
    ):
        response.headers["Cache-Control"] = "no-store"
        authorize(connection, session_id, credentials, lock=True)
        if payload.lab_id not in labs:
            raise HTTPException(404)
        input_data = payload.model_dump(exclude={"lab_id", "idempotency_key"}, mode="json")
        existing = connection.execute(select(runs).where(
            runs.c.session_id == session_id, runs.c.idempotency_key == payload.idempotency_key,
        )).one_or_none()
        if existing:
            if existing.lab_id != payload.lab_id or existing.input != input_data:
                raise HTTPException(409)
            response.status_code = 200
            return stored(existing)

        result = recompute(payload.lab_id, labs[payload.lab_id], payload, request.state.request_id)
        valid_draft = (
            result.status == "INSUFFICIENT_DATA"
            and result.code == "REVIEWED_EVIDENCE_REQUIRED"
            and not result.facts
            and not result.evidence
        )
        valid_verified = (
            result.status == "VERIFIED"
            and result.code == "VERIFIED"
            and bool(result.facts)
            and bool(result.evidence)
        )
        if result.preview is None or not (valid_draft or valid_verified):
            raise HTTPException(409 if result.code == "REVISION_MISMATCH" else 422)
        row = connection.execute(runs.insert().values(
            id=uuid4(), session_id=session_id, idempotency_key=payload.idempotency_key,
            lab_id=payload.lab_id, created_at=datetime.now(UTC),
            input=input_data, result=result.model_dump(mode="json"),
        ).returning(runs)).one()
        return stored(row)

    @router.get("/{session_id}/runs", response_model=RunPage)
    def list_runs(
        session_id: UUID, lab_id: str, response: Response,
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
        offset: Annotated[int, Query(ge=0, le=100000)] = 0,
        connection: Connection = db,
    ):
        response.headers["Cache-Control"] = "no-store"
        authorize(connection, session_id, credentials)
        if lab_id not in labs:
            raise HTTPException(404)
        rows = connection.execute(select(runs).where(
            runs.c.session_id == session_id, runs.c.lab_id == lab_id,
        ).order_by(runs.c.created_at.desc(), runs.c.id.desc()).offset(offset).limit(PAGE_SIZE + 1)).all()
        return RunPage(
            items=[stored(row) for row in rows[:PAGE_SIZE]],
            next_offset=offset + PAGE_SIZE if len(rows) > PAGE_SIZE else None,
        )

    @router.get("/{session_id}/runs/{run_id}", response_model=StoredRun)
    def get_run(
        session_id: UUID, run_id: UUID, response: Response,
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
        connection: Connection = db,
    ):
        response.headers["Cache-Control"] = "no-store"
        authorize(connection, session_id, credentials)
        row = connection.execute(select(runs).where(
            runs.c.session_id == session_id, runs.c.id == run_id,
        )).one_or_none()
        if row is None:
            raise HTTPException(404)
        return stored(row)

    return router
