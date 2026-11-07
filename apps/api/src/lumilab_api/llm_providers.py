"""Provider boundary with explicit routes, timeouts and no SDK retries."""
import json
import os
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

import httpx
from pydantic import BaseModel, ConfigDict, Field, SecretStr

from .provider_limits import safe_headers


class Route(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    id: str = Field(pattern=r"^[a-z0-9-]{1,60}$")
    provider: Literal["gemini", "mistral", "groq", "openrouter", "local"]
    model: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_./:-]+$")
    role: Literal["base", "hard", "fallback", "guard"] = "base"
    enabled: bool = False
    account_verified: bool = False
    policy_verified: bool = False
    quota_verified: bool = False
    minors_approved: bool = False
    free_only: bool = True
    input_usd_per_million: float = Field(default=0, ge=0, le=1000)
    output_usd_per_million: float = Field(default=0, ge=0, le=1000)
    api_key_env: str = Field(default="", pattern=r"^(LUMILAB_[A-Z_]+)?$")
    local_url: str | None = None
    rpm_limit: int | None = Field(default=None, ge=1, le=1000)
    rpd_limit: int | None = Field(default=None, ge=1, le=100000)
    tpm_limit: int | None = Field(default=None, ge=1)
    tpd_limit: int | None = Field(default=None, ge=1)
    priority: int = Field(default=100,ge=0,le=1000)
    json_mode: Literal['schema','object'] = 'schema'
    modes: list[Literal['hint', 'explanation', 'feedback', 'qa']] = Field(
        default_factory=lambda: ['hint', 'explanation', 'feedback', 'qa'])
    token_scope: Literal['provider', 'model'] = 'provider'

    def allowed(self, audience: str) -> bool:
        if not all([self.enabled, self.account_verified, self.policy_verified, self.quota_verified]):
            return False
        if audience == "under18" and not self.minors_approved:
            return False
        if self.free_only and (self.input_usd_per_million or self.output_usd_per_million):
            return False
        return True


@dataclass
class Completion:
    data: dict
    input_tokens: int = 0
    output_tokens: int = 0
    headers: dict = field(default_factory=dict)


class ProviderFailure(RuntimeError):
    def __init__(self, message, *, retryable=False, status_code=None, headers=None):
        super().__init__(message)
        self.retryable, self.status_code = retryable, status_code
        self.headers = headers or {}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ProviderFailure("PROVIDER_REDIRECT_BLOCKED")


class HttpProvider:
    live = True

    def __init__(self, route: Route, timeout: float = 8, max_output: int = 384, transport=None, api_key: SecretStr | None = None):
        self.route, self.timeout, self.max_output = route, timeout, max_output
        self.transport = transport or self._send
        self.api_key = api_key

    @staticmethod
    def _send(url, headers, body, timeout):
        if url.startswith('https://api.groq.com/'):
            return groq_json('POST', url, headers, timeout, body)
        request = Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
        try:
            with build_opener(NoRedirect()).open(request, timeout=timeout) as response:
                data = response.read(200001)
                if len(data) > 200000:
                    raise ProviderFailure("PROVIDER_RESPONSE_TOO_LARGE")
                result = json.loads(data)
                result['_lumilab_headers'] = safe_headers(response.headers)
                return result
        except HTTPError as exc:
            limits=safe_headers(exc.headers or {})
            if exc.code==429:
                limits.setdefault('retry-after','60')
            raise ProviderFailure("PROVIDER_REQUEST_FAILED", status_code=exc.code,
                retryable=exc.code in {408, 429, 500, 502, 503, 504},headers=limits) from exc
        except (URLError, TimeoutError, OSError) as exc:
            # Do not surface provider error bodies, URLs or keys in public/log messages.
            raise ProviderFailure("PROVIDER_REQUEST_FAILED", retryable=True) from exc
        except ValueError as exc:
            raise ProviderFailure("PROVIDER_INVALID_JSON") from exc

    def generate(self, messages: list[dict], schema: dict) -> Completion:
        route = self.route
        key = self.api_key.get_secret_value() if self.api_key else (os.environ.get(route.api_key_env, "") if route.api_key_env else "")
        if route.provider != "local" and not key:
            raise ProviderFailure("PROVIDER_KEY_MISSING")
        headers = {"Content-Type": "application/json"}
        if route.provider == "gemini":
            url = "https://generativelanguage.googleapis.com/v1beta/models/" + route.model + ":generateContent"
            headers["x-goog-api-key"] = key
            body = {"systemInstruction": {"parts": [{"text": messages[0]["content"]}]},
                    "contents": [{"role": "user", "parts": [{"text": messages[1]["content"]}]}],
                    "generationConfig": {"maxOutputTokens": self.max_output,
                        "responseMimeType": "application/json", "responseJsonSchema": schema,
                        "thinkingConfig": {"thinkingLevel": "low" if route.model == "gemini-3.8-flash" else "minimal"}}}
            result = self.transport(url, headers, body, self.timeout)
            parts = result["candidates"][0]["content"]["parts"]
            text = "".join(part.get("text", "") for part in parts if not part.get("thought"))
            usage = result.get("usageMetadata", {})
            return Completion(json.loads(text), usage.get("promptTokenCount", 0),
                usage.get("candidatesTokenCount", 0) + usage.get("thoughtsTokenCount", 0))
        urls = {"mistral": "https://api.mistral.ai/v1/chat/completions",
                "groq": "https://api.groq.com/openai/v1/chat/completions",
                "openrouter": "https://openrouter.ai/api/v1/chat/completions"}
        if route.provider == "local":
            from urllib.parse import urlsplit
            parsed = urlsplit(route.local_url or "")
            if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
                raise ProviderFailure("LOCAL_ENDPOINT_MUST_BE_LOOPBACK")
            url = route.local_url.rstrip("/") + "/v1/chat/completions"
        else:
            url = urls[route.provider]
            headers["Authorization"] = "Bearer " + key
        body = {"model": route.model, "messages": messages, "max_tokens": self.max_output,
                "temperature": .2, "response_format": {"type": "json_schema",
                    "json_schema": {"name": "tutor_output", "schema": schema, "strict": True}}}
        if route.provider == 'groq':
            body['messages']=deepcopy(messages)
            if body['messages']:
                body['messages'][0]['content']+=' Return a JSON object matching the supplied output schema.'
            if route.model.startswith('openai/gpt-oss-'):
                body['reasoning_effort'] = 'low'
            elif route.model == 'qwen/qwen3.8-27b':
                body['reasoning_effort'] = 'none'
                body['reasoning_format'] = 'hidden'
            if route.json_mode == 'object':
                body['response_format'] = {'type':'json_object'}
            else:
                body['response_format']['json_schema']['schema'] = strict_schema(schema)
        result = self.transport(url, headers, body, self.timeout)
        usage = result.get("usage", {})
        return Completion(json.loads(result["choices"][0]["message"]["content"]),
            usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0),result.get('_lumilab_headers',{}))


def strict_schema(schema):
    result=deepcopy(schema)
    def visit(value):
        if isinstance(value,dict):
            for key in ('default','minLength','maxLength','minItems','maxItems','pattern','format','minimum','maximum'):
                value.pop(key,None)
            if value.get('type')=='object':
                value['required']=list(value.get('properties',{}))
                value['additionalProperties']=False
            for child in value.values():
                visit(child)
        elif isinstance(value,list):
            for child in value:
                visit(child)
    visit(result)
    return result


def groq_json(method, url, headers, timeout, body=None):
    """Standard HTTPX client, no redirect/retry or proxy/identity workarounds.

    The same authorized key/endpoint returned 200 via HTTPX while urllib returned
    403. Use the supported HTTP client path rather than guessing account failure.
    """
    if url not in {'https://api.groq.com/openai/v1/models',
                   'https://api.groq.com/openai/v1/chat/completions'}:
        raise ProviderFailure('GROQ_ENDPOINT_NOT_ALLOWED')
    try:
        with httpx.Client(timeout=timeout, follow_redirects=False) as client:
            with client.stream(method, url, headers=headers, json=body) as response:
                limits = safe_headers(response.headers)
                if 300 <= response.status_code < 400:
                    raise ProviderFailure('PROVIDER_REDIRECT_BLOCKED')
                if response.status_code >= 400:
                    if response.status_code == 429:
                        limits.setdefault('retry-after', '60')
                    raise ProviderFailure('PROVIDER_REQUEST_FAILED', status_code=response.status_code,
                        retryable=response.status_code in {408,429,500,502,503,504}, headers=limits)
                data = bytearray()
                for part in response.iter_bytes():
                    data.extend(part)
                    if len(data) > 200000:
                        raise ProviderFailure('PROVIDER_RESPONSE_TOO_LARGE')
                result = json.loads(data)
                if not isinstance(result, dict):
                    raise ValueError('Expected object')
                result['_lumilab_headers'] = limits
                return result
    except httpx.HTTPError as exc:
        raise ProviderFailure('PROVIDER_REQUEST_FAILED', retryable=True) from exc
    except ValueError as exc:
        raise ProviderFailure('PROVIDER_INVALID_JSON') from exc
