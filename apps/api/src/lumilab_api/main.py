import json
import logging
from contextlib import asynccontextmanager
from time import perf_counter
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException

from lumilab_api.catalog import CatalogResponse, LabDefinition, load_catalog
from lumilab_api.data_pipeline import load_registry
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.llm_budget import PostgresBudget
from lumilab_api.llm_gateway import Gateway
from lumilab_api.llm_providers import Route
from lumilab_api.provider_check import validate_manifest
from lumilab_api.recompute import load_runtime_definitions
from lumilab_api.retrieval import retrieval_router
from lumilab_api.session_routes import session_router
from lumilab_api.settings import Settings
from lumilab_api.system_info import SystemInfo, load_practice_map, system_info, validate_mapping
from lumilab_api.tutor_routes import tutor_router
from lumilab_api.vector_index import VectorConfig, VectorUnavailable
from lumilab_api.verification_routes import verification_router

logger = logging.getLogger("lumilab.requests")
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)
logger.propagate = False


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or Settings()
    registry = load_registry(config.knowledge_dir / "pipeline/sources.json")
    routes = [Route.model_validate(item) for item in json.loads(
        (config.knowledge_dir / "pipeline/providers.json").read_text(encoding="utf-8"))["routes"]]
    if config.llm_enabled and (config.llm_event_cap <= 0 or config.database_url is None
            or not any(route.role != 'guard' and route.allowed(config.llm_audience) for route in routes)):
        raise ValueError("Live LLM disabled until durable budget, policy, quota and provider are configured")
    compiled_index = None
    if config.llm_enabled:
        # Optional classifier unavailability degrades locally; it cannot take down labs.
        active=[r for r in routes if r.role != 'guard' and r.allowed(config.llm_audience)]
        if any(r.provider=='groq' for r in active) and not config.groq_api_key:
            raise ValueError('Groq server key required')
        validate_manifest(config.groq_model_manifest,active,config.groq_api_key)
    if config.rag_artifact_path.is_file():
        try:
            compiled_index = CompiledIndex.load(config.rag_artifact_path, registry,
                provider=VectorConfig.from_env().provider(), chroma_path=config.rag_chroma_path,
                min_cosine=config.rag_min_cosine, min_bm25=config.rag_min_bm25)
        except (ValueError, OSError, ImportError, VectorUnavailable):
            if config.rag_enabled:
                raise ValueError("Semantic RAG disabled: rebuild a matching approved index/model") from None
            # Optional index failure must not take down browser labs/lexical retrieval.
            compiled_index = None
    if config.rag_enabled and (compiled_index is None or not compiled_index.provider.semantic):
        raise ValueError("Semantic RAG disabled until a matching build artifact/model is available")
    catalog = load_catalog(config.knowledge_dir, config.contracts_dir)
    runtime_labs = load_runtime_definitions(config.runtime_lab_dir, config.knowledge_dir)
    mapping = load_practice_map(config.contracts_dir)
    validate_mapping(mapping, runtime_labs)
    release = system_info(config, mapping, runtime_labs, registry, compiled_index)
    engine = None
    if config.database_url:
        url = config.database_url.get_secret_value()
        if not url.startswith("postgresql+psycopg://"):
            raise ValueError("Expected PostgreSQL psycopg connection URL")
        engine = create_engine(
            url, pool_pre_ping=True, pool_size=2, max_overflow=0, pool_timeout=2,
            connect_args={"connect_timeout": 2, "options": "-c statement_timeout=2000"},
        )

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        yield
        if engine is not None:
            engine.dispose()

    app = FastAPI(title="LumiLab API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware, allow_origins=config.allowed_origins, allow_credentials=False,
        allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"],
        expose_headers=["X-Request-ID"],
    )

    def error(request: Request, status: int, code: str, message: str):
        return JSONResponse(status_code=status, content={
            "error": {"code": code, "message": message},
            "request_id": request.state.request_id,
        })

    @app.middleware("http")
    async def request_log(request: Request, call_next):
        request.state.request_id = str(uuid4())
        start = perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # Do not serialize exception messages containing URLs/credentials or user payloads.
            response = error(request, 500, "INTERNAL_ERROR", "Lỗi nội bộ hệ thống")
        response.headers["X-Request-ID"] = request.state.request_id
        route = request.scope.get("route")
        logger.info(json.dumps({
            "event": "http_request", "request_id": request.state.request_id,
            "method": request.method, "route": getattr(route, "path", "unmatched"),
            "status": response.status_code,
            "latency_ms": round((perf_counter() - start) * 1000, 2),
        }))
        return response

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        if exc.status_code == 503 and exc.detail in {"LOCAL_VECTOR_UNAVAILABLE", "LOCAL_INDEX_UNAVAILABLE"}:
            return error(request, 503, exc.detail, "Chỉ mục vector local chưa sẵn sàng")
        code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
        return error(request, exc.status_code, code, "Không tìm thấy tài nguyên" if exc.status_code == 404 else "Yêu cầu không hợp lệ")

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, _exc: RequestValidationError):
        return error(request, 422, "INVALID_REQUEST", "Đầu vào không đúng hợp đồng API")

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "lumilab-api", "stage": "foundation"}

    def database_ready() -> bool:
        if engine is None:
            return False
        try:
            with engine.connect() as connection:
                return connection.execute(text("SELECT 1")).scalar_one() == 1
        except Exception:
            return False

    @app.get("/ready", responses={503: {"description": "Database unavailable"}})
    async def ready(request: Request):
        if not await run_in_threadpool(database_ready):
            return error(request, 503, "DATABASE_NOT_READY", "PostgreSQL chưa sẵn sàng")
        return {"status": "ready", "database": "reachable", "catalog": "loaded"}

    @app.get("/api/v1/runtime-labs", tags=["runtime catalog"])
    def runtime_catalog(include_archived: bool = False):
        return {"schema_version": "catalog-1.0", "items": [
            {**lab.configuration, "lifecycle": lab.lifecycle, "server_recompute": True,
             "verification_notice": "Verified model claim within declared scope"
             if lab.claim and lab.claim.verified_eligible
             else "Draft preview only; reviewed evidence is required"}
            for lab in runtime_labs.values() if include_archived or lab.lifecycle == "active"
        ]}

    @app.get("/api/v1/labs", response_model=CatalogResponse)
    def labs(domain: Literal["physics", "chemistry"] | None = None):
        return CatalogResponse(items=[lab for lab in catalog.values() if domain is None or lab.domain == domain])

    @app.get("/api/v1/labs/{lab_id}", response_model=LabDefinition)
    def lab_detail(lab_id: str):
        if lab_id not in catalog:
            raise HTTPException(status_code=404)
        return catalog[lab_id]

    app.include_router(verification_router(catalog, runtime_labs))
    @app.get("/api/v1/system", response_model=SystemInfo, tags=["system"])
    def release_identity():
        return release

    app.include_router(retrieval_router(config.knowledge_dir, set(runtime_labs), compiled_index=compiled_index, source_registry=registry))
    budget = PostgresBudget(engine, event_id=config.llm_event_id, event_cap=config.llm_event_cap,
        daily_microusd=config.llm_daily_microusd, session_rpm=config.llm_session_rpm,
        session_daily=config.llm_session_daily, reserved_demo=config.llm_reserved_demo)
    gateway = Gateway(config, registry, routes, budget)
    @app.get("/api/v1/tutor/status", tags=["Lumi Tutor"])
    def tutor_status():
        return {"live_enabled": config.llm_enabled, "audience": config.llm_audience,
                "hybrid_available": compiled_index is not None,
                "embedding": compiled_index.provider.id if compiled_index else None,
                "notice": "Preview chưa duyệt; chưa VERIFIED"}

    app.include_router(tutor_router(engine, compiled_index, gateway, set(runtime_labs)))
    app.include_router(session_router(engine, runtime_labs))
    return app


app = create_app()
