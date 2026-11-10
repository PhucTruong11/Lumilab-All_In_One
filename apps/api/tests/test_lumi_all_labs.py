"""Offline Q&A regressions; fake provider responses are not scientific evidence."""
import json
from pathlib import Path
from uuid import uuid4

import pytest
from jsonschema import Draft7Validator
from test_cache_correctness import FakeBudget, _context, _registry, _route

from lumilab_api.llm_budget import BudgetDenied
from lumilab_api.llm_gateway import Gateway, HistoryMessage, groq_prompt, validate_output
from lumilab_api.llm_providers import Completion
from lumilab_api.settings import Settings
from lumilab_api.tutor_context import DraftRunEvidence, TutorContext, TutorTask

ROOT = Path(__file__).resolve().parents[3]
CATALOG = json.loads((ROOT / 'packages/lab-engine/labs/catalog.json').read_text('utf-8'))
LABS = CATALOG['active'] + CATALOG['archived']


def context(lab='precipitation', mode='qa'):
    return TutorContext(task=TutorTask(lab_id=lab, question='AgCl là gì?', mode=mode),
                        corpus_revision='fixture', retrieval_method='local-hybrid-hash', sources=[])


def gateway(calls, message='AgCl là bạc clorua. Công thức phản ứng: AgNO3 + NaCl → AgCl + NaNO3.'):
    class Provider:
        def __init__(self, *_args, **_kwargs):
            pass

        def generate(self, messages, _schema):
            calls.append(messages)
            return Completion({'message': message, 'citation_ids': []})

    return Gateway(Settings(_env_file=None, llm_enabled=True, llm_audience='adults'),
                   _registry(), [_route()], FakeBudget(), provider_factory=Provider)


@pytest.mark.parametrize('lab', [*LABS, None])
def test_qa_reaches_provider_for_every_implemented_lab_without_rag(lab):
    calls = []
    answer = gateway(calls).generate(context(lab), session_id=uuid4())
    assert answer.response_source == 'llm', answer.degraded_reason
    assert answer.attempts == 1 and len(calls) == 1
    assert answer.output.citation_ids == []
    assert answer.status == 'DRAFT_GUIDANCE'
    assert 'AgNO3' in answer.output.message


@pytest.mark.parametrize('lab,mode', [('not-implemented', 'qa'), ('precipitation', 'hint'),
                                    ('atomic', 'explanation'), ('capacitor', 'feedback')])
def test_scope_expansion_does_not_open_unknown_labs_or_nonpilot_experiments(lab, mode):
    calls = []
    answer = gateway(calls).generate(context(lab, mode), session_id=uuid4())
    assert answer.degraded_reason == 'MVP_SCOPE_ONLY'
    assert calls == []


@pytest.mark.parametrize('message', ['AgNO3 + NaCl → AgCl + NaNO3.',
                                    'CO₂ là cacbon đioxit.',
                                    'Ở 25 °C, dung dịch trung tính có pH = 7.',
                                    'Chu kỳ con lắc đơn: T = 2π√(L/g), với góc nhỏ.'])
def test_qa_accepts_formula_digits_and_general_numeric_knowledge(message):
    assert validate_output({'message': message, 'citation_ids': []}, context('chemistry')).message == message


@pytest.mark.parametrize('candidate', [
    {'message': 'Kết quả đã được kiểm chứng, VERIFIED.', 'citation_ids': []},
    {'message': 'AgCl là bạc clorua.', 'citation_ids': ['invented']},
    {'message': 'Số đo là 999.', 'citation_ids': [], 'preview': {'mass_g': 999}},
    {'message': 'Đã duyệt.', 'citation_ids': []},
])
def test_qa_cannot_fabricate_citations_scientific_fields_or_approval(candidate):
    with pytest.raises(ValueError):
        validate_output(candidate, context())


@pytest.mark.parametrize('mode,run_id', [('hint', None), ('explanation', None),
                                       ('feedback', None), ('qa', uuid4())])
def test_unscoped_questions_cannot_attach_runs_or_request_experiment_guidance(mode, run_id):
    with pytest.raises(ValueError):
        TutorTask(lab_id=None, question='Nước là gì?', mode=mode, run_id=run_id)


@pytest.mark.parametrize('name', ['tutor-task', 'tutor-request'])
def test_public_schemas_match_unscoped_qa_constraints(name):
    validator = Draft7Validator(json.loads((ROOT / f'packages/contracts/schemas/{name}.schema.json').read_text('utf-8')))
    payload = {'lab_id': None, 'question': 'Nước là gì?', 'mode': 'qa'}
    assert validator.is_valid(payload)
    assert not validator.is_valid({**payload, 'mode': 'hint'})
    assert not validator.is_valid({**payload, 'run_id': str(uuid4())})
    assert not validator.is_valid({'lab_id': None, 'question': 'Nước là gì?'})
    assert validator.is_valid({**payload, 'lab_id': 'precipitation', 'mode': 'hint'})


def test_experiment_guidance_still_rejects_generated_numeric_readings():
    ctx, _ = _context()
    with pytest.raises(ValueError, match='NUMERIC_OR_APPROVAL_CLAIM'):
        validate_output({'message': 'Chu kỳ đo được là 999 s.',
                         'citation_ids': [ctx.sources[0].chunk_id]}, ctx)


def test_exhausted_quota_is_explained_without_unrelated_experiment_advice():
    class ExhaustedBudget(FakeBudget):
        def reserve(self, *_args, **_kwargs):
            raise BudgetDenied('ATTEMPT_CAP_EXCEEDED')

    calls = []
    gw = gateway(calls)
    gw.budget = ExhaustedBudget()
    answer = gw.generate(context(), session_id=uuid4())
    assert answer.degraded_reason == 'ATTEMPT_CAP_EXCEEDED'
    assert 'giới hạn lượt AI' in answer.output.message
    assert answer.output.follow_up is None and answer.output.citation_ids == []
    assert calls == [] and answer.attempts == 0


def test_llm_text_does_not_change_owned_run_measurements():
    ctx = context().model_copy(update={'run': DraftRunEvidence(run_id=uuid4(), lab_id='precipitation',
        model_version='fixture', dataset_version='fixture', preview={'mass_g': 0.14332})})
    original = ctx.model_dump()
    answer = gateway([]).generate(ctx, session_id=uuid4())
    assert answer.response_source == 'llm'
    assert ctx.model_dump() == original
    assert 'preview' not in answer.output.model_dump() and 'facts' not in answer.output.model_dump()


def test_groq_keeps_a_complete_followup_exchange_within_its_budget():
    history = [HistoryMessage(role='user', text='AgCl là gì?'),
               HistoryMessage(role='assistant', text='Đó là bạc clorua, một kết tủa trắng.')]
    messages, _ = groq_prompt(context(), history, ROOT / 'knowledge/tutor-skills')
    body = json.loads(messages[1]['content'])
    assert [item['role'] for item in body['history']] == ['user', 'assistant']
    assert 'AgCl' in body['history'][0]['text']
    assert len(json.dumps(messages, ensure_ascii=False).encode()) <= 3600
