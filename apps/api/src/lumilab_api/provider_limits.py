"""Parse only documented quota headers; never store arbitrary response headers."""
import re

NAMES = {'retry-after','x-ratelimit-remaining-requests','x-ratelimit-remaining-tokens',
    'x-ratelimit-reset-requests','x-ratelimit-reset-tokens'}


def safe_headers(headers):
    return {str(k).lower():str(v)[:80] for k,v in headers.items() if str(k).lower() in NAMES}


def seconds(value):
    if value is None:
        return None
    if re.fullmatch(r'\d+(?:\.\d+)?',value):
        return min(86400,float(value))
    parts = re.findall(r'(\d+(?:\.\d+)?)(ms|h|m|s)',value)
    if not parts or ''.join(a+b for a,b in parts) != value:
        return None
    return min(86400,sum(float(n)*{'ms':.001,'s':1,'m':60,'h':3600}[u] for n,u in parts))


def count(value):
    return min(1_000_000_000,int(value)) if value and re.fullmatch(r'\d+',value) else None
def route_token_budget(route, settings):
    """Model quota is not an entitlement to multiply the organization's budget."""
    shared = route.provider == 'groq' and route.token_scope == 'model'
    return {
        'provider_tpm': settings.groq_shared_tpm if shared else route.tpm_limit,
        'provider_tpd': settings.groq_shared_tpd if shared else route.tpd_limit,
        'model_tpm': route.tpm_limit if route.token_scope == 'model' else None,
        'model_tpd': route.tpd_limit if route.token_scope == 'model' else None,
    }
