from urllib.error import HTTPError
from uuid import uuid4

import pytest
from test_data_rag_gateway import FakeBudget, context_fixture

from lumilab_api.llm_budget import BudgetDenied
from lumilab_api.llm_gateway import Gateway
from lumilab_api.llm_providers import Completion, HttpProvider, ProviderFailure, Route
from lumilab_api.settings import Settings


def routes():
    return [Route(id='backup',provider='gemini',model='gemini-3.8-flash',role='fallback',
        enabled=True,account_verified=True,policy_verified=True,quota_verified=True,rpm_limit=5,rpd_limit=20),
        Route(id='primary',provider='gemini',model='gemini-3.5-flash-lite',
        enabled=True,account_verified=True,policy_verified=True,quota_verified=True,rpm_limit=15,rpd_limit=500)]


def run_gateway(factory,budget=None,**changes):
    context,registry=context_fixture()
    settings=Settings(_env_file=None,llm_enabled=True,llm_audience='adults',llm_allow_model_fallback=True,**changes)
    return Gateway(settings,registry,routes(),budget or FakeBudget(),provider_factory=factory),context


@pytest.mark.parametrize('fault',[ProviderFailure('busy',retryable=True,status_code=429),TimeoutError()])
def test_primary_transient_failure_uses_backup_once_and_charges_both(fault):
    called=[]
    budget=FakeBudget()
    def factory(route,*args):
        class Provider:
            def generate(self,messages,schema):
                called.append(route.model)
                if route.role=='base':
                    raise fault
                return Completion({'message':'Em thử giữ một yếu tố không đổi.','citation_ids':['pendulum-overview:0']})
        return Provider()
    gateway,context=run_gateway(factory,budget)
    result=gateway.generate(context,session_id=uuid4())
    assert called==['gemini-3.5-flash-lite','gemini-3.8-flash']
    assert result.model=='gemini-3.8-flash' and result.attempts==len(budget.calls)==2
    assert [x['outcome'] for x in budget.finished]==['failed','accepted']


def test_bad_key_never_falls_back_and_shared_budget_cannot_be_bypassed():
    called=[]
    def factory(route,*args):
        class Provider:
            def generate(self,*args):
                called.append(route.model)
                raise ProviderFailure('key',status_code=401)
        return Provider()
    gateway,ctx=run_gateway(factory)
    assert gateway.generate(ctx,session_id=uuid4()).attempts==1
    assert called==['gemini-3.5-flash-lite']
    called.clear()
    gateway,ctx=run_gateway(factory,FakeBudget(deny=True))
    assert gateway.generate(ctx,session_id=uuid4()).attempts==0 and not called


def test_primary_model_quota_can_use_backup_without_consuming_primary_attempt():
    class Budget(FakeBudget):
        def reserve(self,session,route,**kwargs):
            if route=='primary':
                raise BudgetDenied('MODEL_RATE_LIMIT_EXCEEDED')
            assert kwargs['model_rpm']==5 and kwargs['model_rpd']==20
            return super().reserve(session,route,**kwargs)
    def factory(route,*args):
        class Provider:
            def generate(self,*args): return Completion({'message':'Em thử lại.','citation_ids':['pendulum-overview:0']})
        return Provider()
    gateway,ctx=run_gateway(factory,Budget())
    result=gateway.generate(ctx,session_id=uuid4())
    assert result.model=='gemini-3.8-flash' and result.attempts==1


@pytest.mark.parametrize('model,level',[('gemini-3.5-flash-lite','minimal'),('gemini-3.8-flash','low')])
def test_thinking_configuration_is_model_specific(monkeypatch,model,level):
    monkeypatch.setenv('LUMILAB_GEMINI_API_KEY','fake-test')
    def transport(url,headers,body,timeout):
        assert body['generationConfig']['thinkingConfig']['thinkingLevel']==level
        return {'candidates':[{'content':{'parts':[{'text':'{"message":"OK"}'}]}}]}
    HttpProvider(Route(id='test',provider='gemini',model=model,api_key_env='LUMILAB_GEMINI_API_KEY'),transport=transport).generate(
        [{'content':'rules'},{'content':'fixed'}],{})


def test_both_gemini_models_remain_blocked_for_under18():
    assert all(not route.allowed('under18') for route in routes())


@pytest.mark.parametrize('status,retryable',[(429,True),(503,True),(401,False),(403,False)])
def test_http_status_classification_does_not_leak_provider_body(monkeypatch,status,retryable):
    class Opener:
        def open(self,*args,**kwargs):
            raise HTTPError('https://example.test',status,'private provider detail',None,None)
    monkeypatch.setattr('lumilab_api.llm_providers.build_opener',lambda *_:Opener())
    with pytest.raises(ProviderFailure) as error:
        HttpProvider._send('https://example.test',{}, {},8)
    assert error.value.status_code==status and error.value.retryable==retryable
    assert 'private provider detail' not in str(error.value)


@pytest.mark.parametrize('enabled,expected',[(False,1),(True,2)])
def test_model_fallback_opt_in_and_total_attempt_cap(enabled,expected):
    called=[]
    def factory(route,*args):
        class Provider:
            def generate(self,*args):
                called.append(route.model)
                raise TimeoutError()
        return Provider()
    gateway,ctx=run_gateway(factory)
    gateway.settings.llm_allow_model_fallback=enabled
    ctx.task.mode='explanation'
    ctx.task.question='Giải thích điều kiện mô hình. ' * 8
    result=gateway.generate(ctx,session_id=uuid4())
    assert result.response_source=='template' and result.attempts==len(called)==expected
    assert called[0]=='gemini-3.5-flash-lite'
