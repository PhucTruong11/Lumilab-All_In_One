"""Initial PostgreSQL schema for anonymous sessions and draft runs."""

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    UniqueConstraint,
    Uuid,
    create_engine,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB

from lumilab_api.settings import Settings

metadata = MetaData()
llm_tokens = Table('llm_token_budgets',metadata,
    Column('key',String(220),primary_key=True),Column('reserved_tokens',BigInteger,nullable=False))
llm_headers = Table('llm_provider_headers',metadata,
    Column('key',String(220),primary_key=True),
    Column('remaining_requests',BigInteger),Column('remaining_tokens',BigInteger),
    Column('requests_until',DateTime(timezone=True)),Column('tokens_until',DateTime(timezone=True)),
    Column('blocked_until',DateTime(timezone=True)))
sessions = Table(
    "lab_sessions", metadata,
    Column("id", Uuid, primary_key=True),
    Column("token_hash", String(64), nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
)
runs = Table(
    "lab_runs", metadata,
    Column("id", Uuid, primary_key=True),
    Column("session_id", ForeignKey("lab_sessions.id", ondelete="CASCADE"), nullable=False),
    Column("idempotency_key", Uuid, nullable=False),
    Column("lab_id", String(32), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("input", JSONB, nullable=False),
    Column("result", JSONB, nullable=False),
    UniqueConstraint("session_id", "idempotency_key"),
    Index("ix_lab_runs_history", "session_id", "lab_id", "created_at", "id"),
)


llm_counters = Table(
    "llm_budget_counters", metadata,
    Column("key", String(220), primary_key=True),
    Column("attempts", Integer, nullable=False),
    Column("reserved_microusd", BigInteger, nullable=False),
)
llm_attempts = Table(
    "llm_attempts", metadata,
    Column("id", Uuid, primary_key=True),
    Column("session_id", ForeignKey("lab_sessions.id", ondelete="CASCADE"), nullable=False),
    Column("route", String(100), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("reserved_microusd", BigInteger, nullable=False),
    Column("outcome", String(40), nullable=False),
    Column("input_tokens", Integer, nullable=False, default=0),
    Column("output_tokens", Integer, nullable=False, default=0),
    Column("latency_ms", Integer, nullable=False, default=0),
)


def migrate():
    settings = Settings()
    if settings.database_url is None:
        raise SystemExit("Set LUMILAB_DATABASE_URL before migrating.")
    engine = create_engine(settings.database_url.get_secret_value())
    try:
        with engine.begin() as connection:
            connection.execute(text("SELECT pg_advisory_xact_lock(46173124)"))
            metadata.create_all(connection)
    finally:
        engine.dispose()


if __name__ == "__main__":
    migrate()
