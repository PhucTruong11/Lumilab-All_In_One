import json
from datetime import UTC, datetime

import pytest

from lumilab_api.live_system_eval import check_answer, expected_values, prompts, run, summarize
from lumilab_api.settings import Settings


def test_model_readings_are_recomputed_without_llm():
    assert expected_values()=={'current_A':.3,'equivalence_pH':7.,'evidence_status':'DRAFT_PREVIEW'}
    assert 'server_preview' not in json.loads(prompts('closed_book')[1]['content'])
    assert json.loads(prompts('server_tools')[1]['content'])['server_preview']==expected_values()


def test_schema_pass_is_separate_from_numeric_and_preview_safety():
    correct={**expected_values(),'explanation_vi':'Đây là mô hình nháp, chưa có duyệt học thuật.'}
    assert check_answer(correct)['passed']
    assert not check_answer({**correct,'current_A':3.})['numeric_match']
    assert not check_answer({**correct,'explanation_vi':'Đã duyệt chính thức.'})['preview_label_preserved']
    with pytest.raises(ValueError):
        check_answer({**correct,'current_A':float('nan')})
    with pytest.raises(ValueError):
        check_answer({**correct,'evidence_status':'VERIFIED'})


def test_unknown_tokens_and_failed_rows_not_removed_from_summary():
    rows=[{'model':'gemini-3.5-flash-lite','status':'failed','latency_ms':8000},
        {'model':'gemini-3.5-flash-lite','status':'passed','passed':True,'schema_valid':True,
            'numeric_match':True,'usage_reported':True,'input_tokens':30,'output_tokens':10,'latency_ms':1000}]
    metrics=summarize(rows)['chat'][0]
    assert metrics['attempts']==2 and metrics['passed']==1
    assert metrics['unreported_usage_attempts']==1 and metrics['latency_median_ms']==4500


def test_adult_receipt_gate_rejects_before_any_file_database_or_provider(tmp_path):
    output=tmp_path/'out.json'
    with pytest.raises(ValueError,match='ADULT_FREE_TIER_RECEIPT'):
        run(Settings(_env_file=None),{},output)
    assert not output.exists()
    receipt={'purpose':'adult_developer_fixed_smoke','operator_18_plus':True,
        'checked_on':datetime.now(UTC).date().isoformat(),'free_tier_observed':{'groq':True,'gemini':True}}
    with pytest.raises(ValueError,match='DATABASE_AND_KEYS'):
        run(Settings(_env_file=None),receipt,output)
