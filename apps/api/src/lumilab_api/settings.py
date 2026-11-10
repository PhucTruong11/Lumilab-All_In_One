from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="LUMILAB_", env_file=".env", extra="ignore")

    env: str = "development"
    build_sha: str = Field(default="unknown", pattern=r"^(unknown|[0-9a-f]{40})$")
    allowed_origins: list[str] = ["http://127.0.0.1:5175", "http://localhost:5175"]
    knowledge_dir: Path = Path("knowledge")
    contracts_dir: Path = Path("packages/contracts")
    runtime_lab_dir: Path = Path("packages/lab-engine")
    database_url: SecretStr | None = None
    llm_enabled: bool = False
    llm_event_cap: int = Field(default=0, ge=0, le=200)
    llm_local_unlimited: bool = False
    rag_enabled: bool = False
    rag_artifact_path: Path = Path(".local/retrieval/index.json")
    rag_chroma_path: Path | None = None
    rag_min_cosine: float = Field(default=.82, ge=0, le=1)
    rag_min_bm25: float = Field(default=.05, ge=0)
    llm_model: str = "gemini-3.5-flash-lite"
    llm_audience: Literal["under18", "adults"] = "under18"
    llm_event_id: str = Field(default="sgu-hackathon-2026", pattern=r"^[a-z0-9-]{1,64}$")
    llm_daily_microusd: int = Field(default=0, ge=0, le=5000000)
    llm_reserved_demo: int = Field(default=5, ge=0, le=5)
    llm_demo_mode: bool = False
    llm_allow_provider_fallback: bool = False
    llm_allow_model_fallback: bool = False
    llm_max_attempts: int = Field(default=4,ge=1,le=4)
    llm_total_timeout_seconds: float = Field(default=18,gt=0,le=18)
    groq_model_manifest: Path = Path('.local/groq-models.json')
    # Conservative shared envelope; do not infer additive capacity from model rows.
    groq_shared_tpm: int = Field(default=8000, ge=1)
    groq_shared_tpd: int = Field(default=200000, ge=1)
    prompt_guard_enabled: bool = False
    prompt_guard_max_segments: int = Field(default=4, ge=1, le=4)
    prompt_guard_timeout_seconds: float = Field(default=2, gt=0, le=2)
    prompt_guard_threshold: float = Field(default=.5, gt=0, lt=1)
    llm_session_rpm: int = Field(default=4, ge=1, le=10)
    llm_session_daily: int = Field(default=10, ge=1, le=30)
    llm_cache_ttl_seconds: int = Field(default=600, ge=0, le=3600)
    llm_max_input_bytes: int = Field(default=24000, ge=1000, le=32000)
    llm_timeout_seconds: float = Field(default=8, gt=0, le=8)
    llm_max_output_tokens: int = Field(default=384, gt=0, le=384)
    gemini_api_key: SecretStr | None = None
    mistral_api_key: SecretStr | None = None
    groq_api_key: SecretStr | None = None
    openrouter_api_key: SecretStr | None = None

    @model_validator(mode="after")
    def local_limits_scope(self):
        if self.llm_local_unlimited and self.env != "development":
            raise ValueError("Unlimited local attempts require env=development")
        return self
