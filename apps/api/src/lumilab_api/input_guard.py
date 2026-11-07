"""Bounded injection screening. Classification never grants tools or source approval."""
import json
import math
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from time import monotonic, perf_counter

from .injection_rules import REVISION, inspect
from .llm_budget import BudgetDenied
from .llm_providers import HttpProvider, ProviderFailure
from .provider_check import validate_manifest
from .provider_limits import route_token_budget

GUARD_MODEL = 'meta-llama/llama-prompt-guard-2-86m'
RULE_REVISION = REVISION


def local_attack(text):
    """Contextual signal only; no classifier is a complete security boundary."""
    return inspect(text).blocked


def segments(text, max_bytes=384, overlap_chars=32):
    """UTF-8 upper-bound heuristic with overlap, not a claim of exact model tokens.

    Reserve headroom below the documented 512-token context; no trusted rules are
    sent to this classifier. Reject large batches instead of silently truncating.
    """
    result, start = [], 0
    while start < len(text):
        end, size = start, 0
        while end < len(text) and size + len(text[end].encode('utf-8')) <= max_bytes:
            size += len(text[end].encode('utf-8'))
            end += 1
        if end == start:
            raise ValueError('GUARD_SEGMENT_LIMIT')
        result.append(text[start:end])
        if end == len(text):
            break
        start = max(start + 1, end - overlap_chars)
    return result


def attack_score(value):
    """Accept only a bounded scalar or explicit binary label; unknown is not safe.

    Groq's public example does not specify a response contract. These conservative
    forms need a live contract check before activation; no forced chat JSON schema.
    """
    if not isinstance(value, str):
        raise ValueError('GUARD_RESPONSE_UNKNOWN')
    label = value.strip().upper()
    if label in {'BENIGN', 'MALICIOUS'}:
        return float(label == 'MALICIOUS')
    try:
        number = json.loads(value)
    except (ValueError, TypeError):
        raise ValueError('GUARD_RESPONSE_UNKNOWN') from None
    if isinstance(number, bool) or not isinstance(number, (int, float)) or not math.isfinite(number) or not 0 <= number <= 1:
        raise ValueError('GUARD_RESPONSE_UNKNOWN')
    return float(number)


@dataclass
class GuardResult:
    status: str = 'LOCAL_ONLY'
    blocked: bool = False
    attempts: int = 0


class HttpPromptGuard:
    def __init__(self, route, timeout, key):
        self.route, self.timeout, self.key = route, timeout, key

    def classify(self, text):
        if self.route.provider != 'groq' or self.route.model != GUARD_MODEL or not self.key:
            raise ProviderFailure('GUARD_CONFIGURATION_ERROR')
        body = {'model': GUARD_MODEL, 'messages': [{'role': 'user', 'content': text}], 'max_tokens': 16}
        result = HttpProvider._send('https://api.groq.com/openai/v1/chat/completions',
            {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + self.key.get_secret_value()},
            body, self.timeout)
        usage = result.get('usage', {})
        return (attack_score(result['choices'][0]['message']['content']),
            result.get('_lumilab_headers', {}), usage.get('prompt_tokens', 0), usage.get('completion_tokens', 0))


def screen_question(text, *, settings, routes, budget, session_id, deadline, factory=HttpPromptGuard):
    """Remote guard scans only the redacted current question; local rules scan all.

    On provider failure the caller retains local screening and all output guards.
    Total classifier calls <=4, workers <=2, no retries, no student-text logging.
    """
    if not settings.prompt_guard_enabled:
        return GuardResult()
    finding = inspect(text)
    if finding.blocked:
        return GuardResult('LOCAL_BLOCK', True)
    if finding.educational_quote:
        return GuardResult('REMOTE_SKIPPED_QUOTED_EXAMPLE')
    route = next((r for r in routes if r.role == 'guard' and r.model == GUARD_MODEL
        and r.provider == 'groq' and r.allowed(settings.llm_audience)), None)
    if route is None or not settings.groq_api_key:
        return GuardResult('REMOTE_UNAVAILABLE')
    try:
        validate_manifest(settings.groq_model_manifest, [route], settings.groq_api_key)
    except (ValueError, OSError):
        return GuardResult('REMOTE_UNAVAILABLE')
    parts = segments(text)
    if not parts or len(parts) > settings.prompt_guard_max_segments:
        return GuardResult('REMOTE_SKIPPED_LIMIT')

    def scan(part):
        remaining = deadline - monotonic()
        if remaining < .25:
            return None, 0
        try:
            reservation = budget.reserve(session_id, route.id, estimated_microusd=0,
                demo=settings.llm_demo_mode, provider='groq', model='groq/' + GUARD_MODEL,
                estimated_tokens=len(part.encode()) + 64, model_rpm=route.rpm_limit, model_rpd=route.rpd_limit,
                **route_token_budget(route, settings))
        except BudgetDenied:
            return None, 0
        start = perf_counter()
        headers, score, tokens_in, tokens_out = {}, None, 0, 0
        try:
            score, headers, tokens_in, tokens_out = factory(route,
                min(settings.prompt_guard_timeout_seconds, remaining), settings.groq_api_key).classify(part)
            if isinstance(score, bool) or not isinstance(score, (float, int)) or not math.isfinite(score) or not 0 <= score <= 1:
                raise ValueError('GUARD_RESPONSE_UNKNOWN')
        except (ProviderFailure, ValueError, TypeError, KeyError, IndexError, OSError, TimeoutError) as exc:
            headers = getattr(exc, 'headers', {})
            score = None
        if headers and hasattr(budget, 'observe'):
            try:
                budget.observe('groq/' + GUARD_MODEL, headers)
            except BudgetDenied:
                # A storage fault must never erase an already detected attack.
                if score is None or score < settings.prompt_guard_threshold:
                    score = None
        budget.finish(reservation, outcome='accepted' if score is not None else 'failed',
            input_tokens=tokens_in, output_tokens=tokens_out, latency_ms=int((perf_counter()-start)*1000))
        return score, 1

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(scan, parts))
    calls = sum(n for _, n in results)
    if any(score is not None and score >= settings.prompt_guard_threshold for score, _ in results):
        return GuardResult('REMOTE_BLOCK', True, calls)
    if any(score is None for score, _ in results):
        return GuardResult('REMOTE_UNAVAILABLE', attempts=calls)
    return GuardResult('REMOTE_PASS', attempts=calls)
