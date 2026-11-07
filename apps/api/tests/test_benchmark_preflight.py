"""Synthetic fixtures only; no live credentials, reviewer approval or model calls."""
import json
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from pydantic import SecretStr

from lumilab_api.benchmark_runner import (
    BenchmarkReceipt,
    execute,
    messages_for,
    preflight,
    select_cases,
    validate_prediction,
)
from lumilab_api.bm25_index import BM25Index
from lumilab_api.data_pipeline import compile_artifact, load_registry, section_blocks
from lumilab_api.evaluation import normalize_vmlu
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.llm_providers import Completion, HttpProvider, ProviderFailure, Route
from lumilab_api.retrieval import Corpus, RetrievalQuery
from lumilab_api.settings import Settings

ROOT = Path(__file__).resolve().parents[3]


def test_long_source_sections_split_without_loss_or_silent_truncation():
    text = "\n\n".join(["Dữ liệu nguồn cần kiểm tra. " * 60] * 7)
    parts = section_blocks(text)
    assert len(parts) > 1 and all(len(part) <= 3500 for part in parts)
    assert " ".join(" ".join(parts).split()) == " ".join(text.split())
    with pytest.raises(ValueError,match="LONG_SOURCE_TOKEN"):
        section_blocks("x" * 4000)


def index():
    corpus = Corpus.model_validate_json((ROOT / 'knowledge/retrieval/documents.json').read_text(encoding='utf-8'))
    registry = load_registry(ROOT / 'knowledge/pipeline/sources.json')
    return CompiledIndex(compile_artifact(corpus,registry,ROOT / 'packages/lab-engine',include_drafts=True),registry)


def case():
    return {'id':'fixture','subject':'high_school_physics','lab_id':'circuit','level':'THPT',
        'question':'điện trở dòng điện','options':['correct','wrong','wrong','wrong'],'answer':'A',
        'tool':{'operation':'ohm_current','values':{'voltage_V':6,'resistance_ohm':20}}}


def test_bm25_postings_are_built_once_and_filter_before_scoring(monkeypatch):
    built = index()
    monkeypatch.setattr(BM25Index,'build',lambda *_: (_ for _ in ()).throw(AssertionError('No runtime build')))
    assert built.retrieve(RetrievalQuery(lab_id='circuit',query='điện trở')).hits
    hits = built.retrieve(RetrievalQuery(lab_id='circuit',query='điện trở',level='THCS')).hits
    assert hits and all(h.document.provenance.level == 'THCS' for h in hits)


def test_bm25_irrelevant_records_do_not_change_filtered_scores():
    a = BM25Index.build({'a':'resistance current','b':'mass time'})
    b = BM25Index.build({'a':'resistance current','b':'resistance '*1000})
    assert a.rank('current',{'a'}) == b.rank('current',{'a'})
    assert a.coverage('current resistance', 'a') == 1
    with pytest.raises(ValueError, match='mismatch'):
        BM25Index({'version':'bm25-postings-v1','lengths':{'a':99},'postings':{}})


def test_vmlu_accepts_four_subjects_five_choices_and_missing_labels():
    for prefix, subject in [('04','middle_school_chemistry'),('06','middle_school_physics'),
            ('08','high_school_chemistry'),('10','high_school_physics')]:
        row = normalize_vmlu({'id':prefix+'-0001','question':'fixture','choices':['A','B','C','D','E']})
        assert row['subject'] == subject and row['answer'] is None
        assert normalize_vmlu({**row,'answer':'E'})['answer'] == 'E'
    with pytest.raises(ValueError,match='MISMATCH'):
        normalize_vmlu({'id':'04-0001','subject':'high_school_physics','question':'fixture','options':['a']*4})


def test_key_in_settings_is_injected_without_process_environment(monkeypatch):
    monkeypatch.delenv('LUMILAB_GEMINI_API_KEY',raising=False)
    sent = []
    def transport(url,headers,body,timeout):
        sent.append(headers['x-goog-api-key'])
        assert body['generationConfig']['maxOutputTokens'] == 384
        return {'candidates':[{'content':{'parts':[{'text':'{"message":"fixture"}'}]}}]}
    provider = HttpProvider(Route(id='fixture',provider='gemini',model='gemini-3.5-flash-lite'),
        api_key=SecretStr('fake-test-key'),transport=transport)
    provider.generate([{'role':'system','content':'rule'},{'role':'user','content':'fixture'}],{})
    assert sent == ['fake-test-key']


def test_benchmark_never_includes_answer_and_tools_only_in_third_mode():
    for mode in ('no_rag','rag','rag_tools'):
        messages, tool = messages_for(case(),mode,[])
        question = json.loads(messages[1]['content'])['student_question']
        assert 'answer' not in question and 'tool' not in question
        assert (tool is not None) == (mode == 'rag_tools')
    with pytest.raises(ValueError,match='CITATION'):
        validate_prediction({'answer':'A','explanation':'fixture','citation_ids':['fake']},case(),'no_rag',[],None)
    with pytest.raises(ValueError,match='NUMERIC'):
        validate_prediction({'answer':'A','explanation':'fixture','citation_ids':[],'numeric_result':99},case(),'rag_tools',[],{'value':.3})


def test_preflight_denies_keys_quota_rights_and_draft_sources_before_network(tmp_path):
    path = tmp_path/'fixture.json'
    path.write_text('{}',encoding='utf-8')
    receipt = BenchmarkReceipt(purpose='adult_developer_benchmark',checked_on=datetime.now(UTC).date().isoformat())
    result = preflight(Settings(_env_file=None,database_url=None),receipt,path,[case()],index(),'')
    assert 'GEMINI_KEY_MISSING' in result
    assert 'REVIEWED_SOURCE_PROVIDER_RIGHTS_REQUIRED' in result
    assert 'PLANNED_ATTEMPTS_EXCEED_AVAILABLE_BUDGET' in result
    assert 'DURABLE_DATABASE_REQUIRED' in result
    assert 'BENCHMARK_PROVIDER_RIGHTS_OR_HASH_REQUIRED' in result


def test_benchmark_records_failed_attempt_without_retry_and_keeps_three_modes(tmp_path):
    class Budget:
        def __init__(self): self.calls, self.finished = [], []
        def reserve(self,*args,**kwargs):
            self.calls.append(args)
            return uuid4()
        def finish(self,*args,**kwargs): self.finished.append(kwargs)
    class Provider:
        n = 0
        def __init__(self,*args,**kwargs): pass
        def generate(self,*args):
            Provider.n += 1
            if Provider.n == 1:
                raise ProviderFailure('fixture failure')
            return Completion({'answer':'A','explanation':'fixture','citation_ids':[]},10,5)
    budget = Budget()
    rows = execute([case()],index(),Route(id='fixture',provider='local',model='fixture'),budget,uuid4(),
        tmp_path/'result.jsonl',key='fake',provider_factory=Provider,min_interval_seconds=0)
    assert len(rows) == len(budget.calls) == len(budget.finished) == Provider.n == 3
    assert rows[0]['status'] == 'failed' and rows[0]['answer'] is None
    assert [row['tool_used'] for row in rows] == [False,False,True]
    assert rows[0]['semantic_grounding'] is None
    with pytest.raises(FileExistsError):
        execute([],None,None,None,None,tmp_path/'result.jsonl',key='fake',min_interval_seconds=0)


def test_stratified_selection_is_deterministic_and_bounded():
    cases = [{**case(),'id':str(i),'subject':'middle_school_physics' if i%2 else 'high_school_chemistry'} for i in range(20)]
    chosen = select_cases(cases)
    assert chosen == select_cases(list(reversed(cases))) and len(chosen) == 5
    assert len({row['subject'] for row in chosen}) == 2


def test_semantic_chunks_use_real_token_bound_without_loading_model():
    from lumilab_api.vector_index import SentenceTransformerEmbedding
    provider = object.__new__(SentenceTransformerEmbedding)
    provider.model = SimpleNamespace(max_seq_length=512,tokenizer=SimpleNamespace(
        encode=lambda text,add_special_tokens: text.split(),decode=lambda ids,skip_special_tokens:' '.join(ids)))
    chunks = provider.chunk_text(' '.join(['token']*1000),300)
    assert len(chunks) == 4 and max(len(c.split()) for c in chunks) <= 292
