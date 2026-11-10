"""Session-authorized Tutor orchestration; no client facts or skill paths accepted."""
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from .llm_gateway import Gateway, GatewayAnswer, HistoryMessage
from .retrieval import RetrievalQuery, RetrievalResponse
from .run_schema import runs
from .session_routes import authorize, bearer, stored
from .tutor_context import DraftRunEvidence, TutorContextError, TutorTask, build_tutor_context


class TutorRequest(TutorTask):
    level: Literal["THPT", "THCS"] = "THPT"
    @field_validator("run_id", mode="before")
    @classmethod
    def parse_run_id(cls, value):
        return UUID(value) if isinstance(value, str) else value

    history: list[HistoryMessage] = Field(default_factory=list, max_length=4)
    include_drafts: bool = True


class TutorResponse(BaseModel):
    request_id: str
    answer: GatewayAnswer
    retrieval: RetrievalResponse
    run: DraftRunEvidence | None


class OwnedRunRepository:
    def __init__(self, connection, session_id):
        self.connection, self.session_id = connection, session_id

    def read_owned_run(self, session_id, run_id):
        if session_id != self.session_id:
            return None
        row = self.connection.execute(select(runs).where(
            runs.c.session_id == session_id, runs.c.id == run_id)).one_or_none()
        return stored(row) if row else None


def tutor_router(engine, compiled_index, gateway: Gateway, lab_ids: set[str]):
    router = APIRouter(prefix="/api/v1/sessions", tags=["Lumi Tutor"])

    @router.post("/{session_id}/tutor", response_model=TutorResponse)
    def tutor(session_id: UUID, payload: TutorRequest, request: Request, response: Response,
              credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]):
        response.headers["Cache-Control"] = "no-store"
        if engine is None:
            raise HTTPException(503)
        if payload.lab_id is not None and payload.lab_id not in lab_ids:
            raise HTTPException(404)
        task = TutorTask.model_validate(payload.model_dump(exclude={"history", "include_drafts", "level"}))
        try:
            # Close the ownership transaction before any provider/budget reservation.
            with engine.begin() as connection:
                authorize(connection, session_id, credentials)
                if compiled_index is None or payload.lab_id is None:
                    retrieved = RetrievalResponse(corpus_revision=compiled_index.artifact['corpus_revision']
                        if compiled_index else "index-unavailable", status="NO_MATCH", hits=[])
                else:
                    retrieved = compiled_index.retrieve(RetrievalQuery(lab_id=payload.lab_id,
                        query=payload.question, level=payload.level, include_drafts=payload.include_drafts, retrieval_method="hybrid"))
                    if payload.level == "THPT" and not any(h.document.review_status == "reviewed" for h in retrieved.hits):
                        thcs = compiled_index.retrieve(RetrievalQuery(lab_id=payload.lab_id,
                            query=payload.question, level="THCS", include_drafts=payload.include_drafts, retrieval_method="hybrid"))
                        rev_thcs = [h for h in thcs.hits if h.document.review_status == "reviewed"]
                        if rev_thcs:
                            seen = {h.chunk_id for h in retrieved.hits}
                            merged = [*retrieved.hits, *(h for h in rev_thcs if h.chunk_id not in seen)][:5]
                            retrieved = RetrievalResponse(corpus_revision=retrieved.corpus_revision,
                                retrieval_method=retrieved.retrieval_method, status="FOUND", hits=merged)
                context = build_tutor_context(task, retrieved, session_id=session_id,
                    repository=OwnedRunRepository(connection, session_id))
        except SQLAlchemyError:
            raise HTTPException(503) from None
        except TutorContextError:
            raise HTTPException(404) from None
        # Gateway gets a copy; no repository/DB or executable tools are exposed to the model.
        answer = gateway.generate(context, session_id=session_id, history=payload.history, request_id=request.state.request_id)
        return TutorResponse(request_id=request.state.request_id, answer=answer,
                             retrieval=retrieved, run=context.run)

    return router
