"""Atomic, durable provider-attempt reservations. Failed calls remain charged to cap."""
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError


class BudgetDenied(RuntimeError):
    pass


class PostgresBudget:
    def __init__(self, engine, *, event_id: str, event_cap: int, daily_microusd: int,
                 session_rpm: int = 3, session_daily: int = 10, reserved_demo: int = 5):
        self.engine, self.event_id, self.event_cap = engine, event_id, event_cap
        self.daily_microusd, self.session_rpm, self.session_daily = daily_microusd, session_rpm, session_daily
        self.reserved_demo = reserved_demo

    def reserve(self, session_id, route, *, estimated_microusd: int, demo: bool = False,
                model: str | None = None, model_rpm: int | None = None, model_rpd: int | None = None,
                provider: str | None = None, estimated_tokens: int = 0, provider_tpm=None, provider_tpd=None,
                model_tpm=None, model_tpd=None):
        from .run_schema import llm_attempts, llm_counters, llm_headers, llm_tokens
        if self.engine is None or self.event_cap <= 0 or estimated_microusd < 0 or estimated_tokens < 0:
            raise BudgetDenied("LIVE_BUDGET_DISABLED")
        now = datetime.now(UTC)
        day, minute = now.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%dT%H:%M")
        keys = [("event:" + self.event_id, self.event_cap if demo else max(0, self.event_cap - self.reserved_demo), None),
                ("day:" + self.event_id + ":" + day, None, self.daily_microusd),
                ("session-day:" + str(session_id) + ":" + day, self.session_daily, None),
                ("session-minute:" + str(session_id) + ":" + minute, self.session_rpm, None)]
        if model and model_rpm:
            keys.append(("model-minute:" + model + ":" + minute, model_rpm, None))
        if model and model_rpd:
            keys.append(("model-day:" + model + ":" + day, model_rpd, None))
        try:
            with self.engine.begin() as connection:
                # Stable lock order across instances; one transaction checks every cap.
                for key, cap, cost_cap in sorted(keys):
                    connection.execute(insert(llm_counters).values(key=key, attempts=0, reserved_microusd=0)
                        .on_conflict_do_nothing(index_elements=[llm_counters.c.key]))
                    row = connection.execute(select(llm_counters).where(llm_counters.c.key == key)
                        .with_for_update()).one()
                    if cap is not None and row.attempts >= cap:
                        if key.startswith("model-"):
                            raise BudgetDenied("MODEL_RATE_LIMIT_EXCEEDED")
                        raise BudgetDenied("ATTEMPT_CAP_EXCEEDED")
                    if cost_cap is not None and row.reserved_microusd + estimated_microusd > cost_cap:
                        raise BudgetDenied("DAILY_COST_CAP_EXCEEDED")
                token_keys=[]
                token_limits=[]
                if provider:
                    token_limits.extend([('provider-day:'+provider+':'+day,provider_tpd),
                        ('provider-minute:'+provider+':'+minute,provider_tpm)])
                if model:
                    token_limits.extend([('model-token-day:'+model+':'+day,model_tpd),
                        ('model-token-minute:'+model+':'+minute,model_tpm)])
                for key,cap in sorted(token_limits):
                    token_keys.append(key)
                    connection.execute(insert(llm_tokens).values(key=key,reserved_tokens=0).on_conflict_do_nothing())
                    total=connection.execute(select(llm_tokens).where(llm_tokens.c.key==key).with_for_update()).one()
                    if cap is not None and total.reserved_tokens+estimated_tokens>cap:
                        raise BudgetDenied('MODEL_TOKEN_LIMIT_EXCEEDED' if key.startswith('model-token-') else 'PROVIDER_TOKEN_LIMIT_EXCEEDED')
                if provider == 'groq' and model:
                    connection.execute(insert(llm_headers).values(key=model).on_conflict_do_nothing())
                    state=connection.execute(select(llm_headers).where(llm_headers.c.key==model).with_for_update()).one()
                    if (state.blocked_until and state.blocked_until>now) or (
                        state.requests_until and state.requests_until>now and state.remaining_requests is not None and state.remaining_requests<=1) or (
                        state.tokens_until and state.tokens_until>now and state.remaining_tokens is not None and state.remaining_tokens<estimated_tokens+64):
                        raise BudgetDenied('PROVIDER_HEADER_LIMIT_EXCEEDED')
                    updates={}
                    if state.requests_until and state.requests_until>now and state.remaining_requests is not None:
                        updates['remaining_requests']=max(0,state.remaining_requests-1)
                    if state.tokens_until and state.tokens_until>now and state.remaining_tokens is not None:
                        updates['remaining_tokens']=max(0,state.remaining_tokens-estimated_tokens)
                    if updates:
                        connection.execute(llm_headers.update().where(llm_headers.c.key==model).values(**updates))
                for key in token_keys:
                    connection.execute(llm_tokens.update().where(llm_tokens.c.key==key).values(reserved_tokens=llm_tokens.c.reserved_tokens+estimated_tokens))
                attempt_id = uuid4()
                for key, _, _ in keys:
                    connection.execute(llm_counters.update().where(llm_counters.c.key == key).values(
                        attempts=llm_counters.c.attempts + 1,
                        reserved_microusd=llm_counters.c.reserved_microusd + estimated_microusd))
                connection.execute(llm_attempts.insert().values(id=attempt_id, session_id=session_id,
                    route=route, created_at=now, reserved_microusd=estimated_microusd, outcome="reserved"))
            return attempt_id
        except SQLAlchemyError as exc:
            raise BudgetDenied("BUDGET_STORAGE_UNAVAILABLE") from exc

    def observe(self,model,headers):
        from .provider_limits import count, seconds
        from .run_schema import llm_headers
        now=datetime.now(UTC)
        try:
            with self.engine.begin() as c:
                c.execute(insert(llm_headers).values(key=model).on_conflict_do_nothing())
                row=c.execute(select(llm_headers).where(llm_headers.c.key==model).with_for_update()).one()
                updates={}
                for kind in ('requests','tokens'):
                    n=count(headers.get('x-ratelimit-remaining-'+kind))
                    if n is None:
                        continue
                    reset=seconds(headers.get('x-ratelimit-reset-'+kind))
                    old=getattr(row,'remaining_'+kind)
                    until=getattr(row,kind+'_until')
                    updates['remaining_'+kind]=min(old,n) if old is not None and until and until>now else n
                    updates[kind+'_until']=max(until,now+timedelta(seconds=reset or (86400 if kind=='requests' else 60))) if until and until>now else now+timedelta(seconds=reset or (86400 if kind=='requests' else 60))
                retry=seconds(headers.get('retry-after'))
                if retry is not None:
                    updates['blocked_until']=now+timedelta(seconds=retry)
                if updates:
                    c.execute(llm_headers.update().where(llm_headers.c.key==model).values(**updates))
        except SQLAlchemyError as exc:
            raise BudgetDenied('BUDGET_STORAGE_UNAVAILABLE') from exc

    def finish(self, attempt_id, *, outcome: str, input_tokens: int = 0, output_tokens: int = 0,
               latency_ms: int = 0):
        from .run_schema import llm_attempts
        try:
            with self.engine.begin() as connection:
                connection.execute(llm_attempts.update().where(llm_attempts.c.id == attempt_id).values(
                    outcome=outcome, input_tokens=input_tokens, output_tokens=output_tokens,
                    latency_ms=latency_ms))
        except SQLAlchemyError:
            # Reservation stays consumed even if telemetry settlement fails.
            pass
