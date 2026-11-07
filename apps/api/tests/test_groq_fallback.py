import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest
from test_data_rag_gateway import FakeBudget, context_fixture

from lumilab_api.llm_gateway import Gateway, HistoryMessage, groq_prompt
from lumilab_api.llm_providers import (
    Completion,
    HttpProvider,
    Route,
    strict_schema,
)
from lumilab_api.provider_check import validate_manifest
from lumilab_api.provider_limits import count, safe_headers, seconds
from lumilab_api.settings import Settings
from lumilab_api.tutor_context import TutorOutput

ROOT=Path(__file__).resolve().parents[3]


def test_groq_is_third_route_and_observes_headers_after_two_timeouts():
    context,registry=context_fixture()
    routes=[Route(id='lite',provider='gemini',model='gemini-3.5-flash-lite',priority=10),
        Route(id='flash',provider='gemini',model='gemini-3.8-flash',priority=20),
        Route(id='groq',provider='groq',model='openai/gpt-oss-120b',priority=30,tpm_limit=8000,tpd_limit=200000)]
    for route in routes:
        route.enabled=route.account_verified=route.policy_verified=route.quota_verified=True
    called=[]
    class Budget(FakeBudget):
        observed=[]
        def observe(self,model,headers):self.observed.append((model,headers))
    def factory(route,timeout,*args):
        class Provider:
            def generate(self,messages,schema):
                assert 0<timeout<=8
                called.append(route.model)
                if route.provider!='groq':
                    raise TimeoutError()
                assert len(json.dumps(messages,ensure_ascii=False).encode())<=3600
                return Completion({'message':'Em thử lại.','citation_ids':['pendulum-overview:0']},50,10,
                    {'x-ratelimit-remaining-tokens':'5000'})
        return Provider()
    budget=Budget()
    settings=Settings(_env_file=None,llm_enabled=True,llm_audience='adults',llm_allow_provider_fallback=True)
    result=Gateway(settings,registry,routes,budget,provider_factory=factory).generate(context,session_id=uuid4())
    assert called==['gemini-3.5-flash-lite','gemini-3.8-flash','openai/gpt-oss-120b']
    assert result.model=='openai/gpt-oss-120b' and result.attempts==len(budget.calls)==3
    assert budget.calls[-1][2]['provider_tpd']==200000 and budget.observed


def test_groq_compaction_keeps_seven_blocks_question_and_only_latest_history():
    ctx,_=context_fixture()
    messages,reduced=groq_prompt(ctx,[HistoryMessage(role='user',text='old message'),
        HistoryMessage(role='user',text='latest question')],ROOT/'knowledge/tutor-skills')
    blocks=json.loads(messages[1]['content'])
    assert len(blocks)==6 and len(reduced.sources)<=2
    assert blocks['student_question']==ctx.task.question
    assert len(blocks['history'])<=1 and 'old message' not in str(blocks)


@pytest.mark.parametrize('mode',['schema','object'])
def test_groq_schema_modes_headers_and_no_remote_tools(monkeypatch,mode):
    monkeypatch.setenv('LUMILAB_GROQ_API_KEY','fake-test')
    def transport(url,headers,body,timeout):
        assert url=='https://api.groq.com/openai/v1/chat/completions'
        assert 'tools' not in body and body['response_format']['type']==('json_schema' if mode=='schema' else 'json_object')
        if mode=='schema':
            schema=body['response_format']['json_schema']['schema']
            assert set(schema['required'])==set(schema['properties']) and schema['additionalProperties'] is False
        return {'choices':[{'message':{'content':'{"message":"OK","citation_ids":[],"follow_up":null}'}}],
            '_lumilab_headers':{'x-ratelimit-remaining-requests':'10'}}
    result=HttpProvider(Route(id='groq',provider='groq',model='openai/gpt-oss-120b',json_mode=mode,
        api_key_env='LUMILAB_GROQ_API_KEY'),transport=transport).generate([],TutorOutput.model_json_schema())
    assert result.headers['x-ratelimit-remaining-requests']=='10'
    original=TutorOutput.model_json_schema()
    assert 'follow_up' not in original['required'] and 'follow_up' in strict_schema(original)['required']


def test_quota_header_parser_units_and_allowlist():
    assert seconds('2m59.56s')==pytest.approx(179.56)
    assert seconds('7.66s')==7.66 and seconds('garbage') is None
    assert count('200')==200 and count('-2') is None
    assert safe_headers({'Authorization':'secret','X-RateLimit-Remaining-Tokens':'2'})=={'x-ratelimit-remaining-tokens':'2'}


def test_model_manifest_requires_fresh_matching_ids(tmp_path):
    path=tmp_path/'models.json'
    route=Route(id='groq',provider='groq',model='openai/gpt-oss-120b',tpm_limit=8000,tpd_limit=200000)
    path.write_text(json.dumps({'status':'CHECKED','models':[route.model],
        'checked_at':datetime.now(UTC).isoformat()}),encoding='utf-8')
    validate_manifest(path,[route])
    path.write_text(json.dumps({'status':'CHECKED','models':[route.model],
        'checked_at':(datetime.now(UTC)-timedelta(days=2)).isoformat()}),encoding='utf-8')
    with pytest.raises(ValueError,match='Fresh'):
        validate_manifest(path,[route])


def test_exhausted_deadline_never_calls_provider(monkeypatch):
    ctx,registry=context_fixture()
    route=Route(id='groq',provider='groq',model='fixture',enabled=True,account_verified=True,
        quota_verified=True,policy_verified=True)
    times=iter([0,100])
    monkeypatch.setattr('lumilab_api.llm_gateway.monotonic',lambda:next(times))
    gateway=Gateway(Settings(_env_file=None,llm_enabled=True,llm_audience='adults'),registry,[route],FakeBudget(),
        provider_factory=lambda *_:pytest.fail('No network after deadline'))
    assert gateway.generate(ctx,session_id=uuid4()).degraded_reason=='REQUEST_DEADLINE'


def test_groq_benchmark_receipt_uses_provider_model_and_token_gates(tmp_path):
    from lumilab_api.benchmark_runner import BenchmarkReceipt, preflight
    receipt=BenchmarkReceipt(purpose='adult_developer_benchmark',provider='groq',model='qwen/qwen3.8-27b',
        checked_on='',tpm_limit=8000,tpd_limit=200000)
    path=tmp_path/'data.json'
    path.write_text('{}',encoding='utf-8')
    reasons=preflight(Settings(_env_file=None,groq_model_manifest=tmp_path/'missing.json'),receipt,path,[],None,'')
    assert 'GROQ_KEY_MISSING' in reasons and 'GROQ_MODEL_METADATA_REQUIRED' in reasons
    assert 'SELECTED_MODEL_MISMATCH' not in reasons


def test_groq_benchmark_rejects_oversize_before_any_attempt(tmp_path, monkeypatch):
    from lumilab_api.benchmark_runner import execute
    monkeypatch.setattr('lumilab_api.benchmark_runner.get_sources', lambda *_: [])
    case = {'id': 'large', 'question': 'x' * 5000, 'options': ['A', 'B']}
    report = tmp_path / 'report.jsonl'
    with pytest.raises(ValueError, match='CONTEXT_LIMIT'):
        execute([case], None, Route(id='groq', provider='groq', model='fixture'),
                None, uuid4(), report, key='fixture',
                provider_factory=lambda *_: pytest.fail('No call for oversized batch'))
    assert not report.exists()
