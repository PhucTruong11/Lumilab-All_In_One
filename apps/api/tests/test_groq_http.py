import json

import httpx
import pytest

from lumilab_api.llm_providers import HttpProvider, ProviderFailure, groq_json


def transport(monkeypatch, handler):
    client = httpx.Client
    monkeypatch.setattr('lumilab_api.llm_providers.httpx.Client',
        lambda **kwargs: client(transport=httpx.MockTransport(handler), **kwargs))


def test_httpx_groq_request_keeps_headers_body_and_no_redirect(monkeypatch):
    def handler(request):
        assert request.url == 'https://api.groq.com/openai/v1/chat/completions'
        assert request.headers['authorization'] == 'Bearer fixture'
        assert json.loads(request.content) == {'model':'fixture'}
        return httpx.Response(200,json={'choices':[]},headers={
            'x-ratelimit-remaining-tokens':'4321','set-cookie':'private'})
    transport(monkeypatch,handler)
    result=HttpProvider._send('https://api.groq.com/openai/v1/chat/completions',
        {'Authorization':'Bearer fixture'},{'model':'fixture'},8)
    assert result['_lumilab_headers']=={'x-ratelimit-remaining-tokens':'4321'}


@pytest.mark.parametrize('status,retryable',[(400,False),(401,False),(403,False),(429,True),(503,True)])
def test_httpx_status_errors_are_safe_and_do_not_retry(monkeypatch,status,retryable):
    calls=[]
    def handler(request):
        calls.append(request)
        return httpx.Response(status,json={'error':'private-secret-body'})
    transport(monkeypatch,handler)
    with pytest.raises(ProviderFailure) as error:
        groq_json('GET','https://api.groq.com/openai/v1/models',{},8)
    assert len(calls)==1 and error.value.status_code==status and error.value.retryable==retryable
    assert 'private' not in str(error.value)
    if status==429:
        assert error.value.headers['retry-after']=='60'


@pytest.mark.parametrize('response,code',[
    (httpx.Response(302,headers={'location':'https://other.test'}),'REDIRECT'),
    (httpx.Response(200,content=b'x'*200001),'TOO_LARGE'),
    (httpx.Response(200,json=[]),'INVALID_JSON'),
    (httpx.Response(200,content=b'not json'),'INVALID_JSON')])
def test_httpx_rejects_redirect_oversize_and_bad_shape(monkeypatch,response,code):
    transport(monkeypatch,lambda _:response)
    with pytest.raises(ProviderFailure,match=code):
        groq_json('GET','https://api.groq.com/openai/v1/models',{},8)


def test_httpx_timeout_has_no_body_and_fixed_endpoints_only(monkeypatch):
    def handler(request):
        raise httpx.ReadTimeout('private transport detail')
    transport(monkeypatch,handler)
    with pytest.raises(ProviderFailure,match='PROVIDER_REQUEST_FAILED') as error:
        groq_json('GET','https://api.groq.com/openai/v1/models',{},.1)
    assert error.value.retryable and 'private' not in str(error.value)
    with pytest.raises(ProviderFailure,match='ENDPOINT_NOT_ALLOWED'):
        groq_json('GET','https://other.test',{},8)
