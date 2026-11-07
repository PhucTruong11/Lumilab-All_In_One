"""Explicit metadata check; never called by CI, health or startup network paths."""
import argparse
import json
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from pathlib import Path

from .llm_providers import ProviderFailure, groq_json
from .settings import Settings


def validate_manifest(path,routes,api_key=None):
    active=[r for r in routes if r.provider=='groq']
    if not active:
        return
    try:
        data=json.loads(path.read_text(encoding='utf-8'))
        checked=datetime.fromisoformat(data['checked_at'])
        if checked.tzinfo is None:
            raise ValueError('Timezone required')
    except (OSError,ValueError,KeyError,TypeError):
        raise ValueError('Fresh Groq metadata check required') from None
    if data.get('status')!='CHECKED' or checked<datetime.now(UTC)-timedelta(hours=24) or checked>datetime.now(UTC)+timedelta(minutes=5):
        raise ValueError('Fresh Groq metadata check required')
    if api_key and data.get('key_fingerprint')!=sha256(api_key.get_secret_value().encode()).hexdigest():
        raise ValueError('Groq key changed; repeat metadata check')
    for route in active:
        if route.model not in data['models'] or not route.tpm_limit or not route.tpd_limit:
            raise ValueError('Groq model unavailable or token caps missing')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('.local/groq-models.json'))
    args=parser.parse_args()
    settings=Settings()
    result={'status':'KEY_MISSING','generation_calls':0,'models':[], 'checked_at':datetime.now(UTC).isoformat()}
    if settings.groq_api_key and settings.groq_api_key.get_secret_value():
        result['key_fingerprint']=sha256(settings.groq_api_key.get_secret_value().encode()).hexdigest()
        try:
            data=groq_json('GET','https://api.groq.com/openai/v1/models',
                {'Authorization':'Bearer '+settings.groq_api_key.get_secret_value()},8)
            result.update(status='CHECKED',models=sorted(x['id'] for x in data['data'] if x.get('active',True)))
        except ProviderFailure as exc:
            result.update(status='METADATA_CHECK_FAILED',http_status=exc.status_code)
        except Exception:
            result['status']='METADATA_CHECK_FAILED'
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='key_fingerprint'}))


if __name__=='__main__':
    main()
