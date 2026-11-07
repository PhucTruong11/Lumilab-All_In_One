import json
from pathlib import Path

import pytest

from lumilab_api.bm25_index import BM25Index
from lumilab_api.data_pipeline import compile_artifact, digest, load_registry
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.retrieval import Corpus, RetrievalQuery
from lumilab_api.retrieval_terms import PROFILE, words

ROOT = Path(__file__).resolve().parents[3]


@pytest.mark.parametrize('en,vi',[
    ('pendulum period and mass','chu kỳ con lắc và khối lượng'),
    ('voltage resistance current','hiệu điện thế điện trở dòng điện'),
    ('equivalence point indicator endpoint','điểm tương đương chỉ thị điểm kết thúc'),
    ('limiting reactant precipitate','chất giới hạn kết tủa')])
def test_bilingual_phrases_have_identical_query_and_document_terms(en,vi):
    assert set(words(en)) == set(words(vi))


def test_negation_and_relevance_terms_do_not_mutate_original_source():
    text='Không phải mọi dung dịch trộn vào đều tạo kết tủa.'
    index=BM25Index.build({'a':text})
    assert index.profile==PROFILE and index.rank('precipitate',{'a'})
    assert text=='Không phải mọi dung dịch trộn vào đều tạo kết tủa.'
    assert not words('how does it change')
    assert set(words('Bitcoin ngày mai tăng không?'))=={'bitcoin'}


def test_formula_and_question_scaffolding_do_not_leak_syllables():
    assert set(words('công thức')) == set(words('formula'))
    assert not words('Câu hỏi là gì?')
    assert not set(words('công thức, câu hỏi')) & set(words('thực vật, tế bào'))


def fixture():
    registry=load_registry(ROOT/'knowledge/pipeline/sources.json')
    corpus=Corpus.model_validate_json((ROOT/'knowledge/retrieval/documents.json').read_text(encoding='utf-8'))
    return compile_artifact(corpus,registry,ROOT/'packages/lab-engine',include_drafts=True),registry


def test_lexical_profile_changes_require_explicit_rebuild():
    artifact,registry=fixture()
    artifact['bm25'].pop('profile')
    artifact.pop('fingerprint')
    artifact['fingerprint']=digest(artifact)
    with pytest.raises(ValueError,match='Stale lexical profile'):
        CompiledIndex(artifact,registry)


def test_retrieval_never_expands_lab_level_or_review_scope():
    artifact,registry=fixture()
    index=CompiledIndex(artifact,registry)
    query=RetrievalQuery(lab_id='pendulum',query='Does mass affect period?',level='THPT')
    result=index.retrieve(query)
    assert result.hits and all(h.document.lab_id=='pendulum' and h.document.provenance.level=='THPT'
        for h in result.hits)
    assert all(h.document.review_status=='reviewed' and h.document.reviewer
        for h in index.retrieve(query.model_copy(update={'include_drafts':False})).hits)
    assert not index.retrieve(query.model_copy(update={'query':'Bitcoin ngày mai tăng không?'})).hits
    serialized=json.dumps(artifact,ensure_ascii=False)
    assert 'Đổi' in serialized  # original content, not a translated/generated replacement
