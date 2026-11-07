"""Offline development evaluation, explicitly NOT a Prompt Guard model score."""
import argparse
import hashlib
import json
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from time import perf_counter

from .input_guard import RULE_REVISION, local_attack


def evaluate(cases, predict=local_attack):
    if len({c['id'] for c in cases}) != len(cases):
        raise ValueError('DUPLICATE_CASE')
    tp = fp = tn = fn = unknown = 0
    rows = []
    for case in cases:
        if type(case['attack']) is not bool:
            raise ValueError('BINARY_LABEL_REQUIRED')
        verdict = predict(case['text'])
        if verdict is not None and type(verdict) is not bool:
            raise ValueError('BINARY_PREDICTION_REQUIRED')
        if verdict is None:
            unknown += 1
        elif verdict and case['attack']:
            tp += 1
        elif verdict:
            fp += 1
        elif case['attack']:
            fn += 1
        else:
            tn += 1
        rows.append({'id':case['id'], 'category':case['category'], 'expected_attack':case['attack'],
            'detected':verdict})
    def divide(n, d):
        return n / d if d else None
    return {'cases':len(cases), 'tp':tp, 'fp':fp, 'tn':tn, 'fn':fn, 'unscored':unknown,
        'coverage':divide(len(cases)-unknown,len(cases)), 'precision':divide(tp,tp+fp),
        'recall':divide(tp,tp+fn), 'false_positive_rate':divide(fp,fp+tn),
        'results':rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cases', type=Path, default=Path('knowledge/evaluation/injection-vi-dev.json'))
    parser.add_argument('--output', type=Path, default=Path('.local/evaluation/injection-local.json'))
    args = parser.parse_args()
    start = perf_counter()
    dataset = json.loads(args.cases.read_text(encoding='utf-8'))
    result = evaluate(dataset['cases'])
    report = {'status':'COMPLETED_LOCAL_ONLY', 'measured_component':RULE_REVISION,
        'dataset_revision':dataset['revision'], 'dataset_sha256':hashlib.sha256(args.cases.read_bytes()).hexdigest(),
        'split':'development_not_held_out', 'teacher_reviewed':False,
        'measured_at':datetime.now(UTC).isoformat(), 'llm_calls':0,
        'prompt_guard_model_metrics':None, 'chat_model_metrics':None,
        'metrics':result, 'elapsed_ms':round((perf_counter()-start)*1000,3),
        'git_sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
        'working_tree_dirty':bool(subprocess.check_output(['git','status','--porcelain'],text=True)),
        'limitations':['Self-authored development set; not independent validation.',
            'Heuristics miss obfuscated attacks and can block quoted educational examples.',
            'No inference about Prompt Guard Vietnamese quality, chat accuracy or attack success.']}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k != 'results'}))


if __name__ == '__main__':
    main()
