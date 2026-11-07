# PR Integration Manifest — Baseline a05a0136

Baseline: `a05a01364332845fed6d844e61732352fce3c3d9` (Merge PR #15). Merge order: PR-A first, PR-B second.
Note (Independent Review, 2026-11-07): the proposed 1-line CI workflow patch is NOT part of PR-B; it is held separately in `PR-C-CI-Patch-Proposal/` (unapproved).

| Bundle | Bundle path | Repo destination | SHA256 |
|---|---|---|---|
| PR-A | README.md | README.md | aad262adc2c70b24f6cb7027b6db5dc19deaf439218d82a3756fa7b2c5d4e6b3 |
| PR-A | evidence/rag_b1_experiment.json | knowledge/evaluation/results/rag_b1_experiment.json | 547f552c7cb8ad9baa21dbaa41fae2b3aea4ea811d5d34c56d95891c6e9aed82 |
| PR-A | evidence/rag_eval_dev.csv | knowledge/evaluation/results/rag_eval_dev.csv | fa39df8e67721627d2f0e8e20be146cf4301b8c335a71d1bea9f69af42855a89 |
| PR-A | evidence/rag_eval_dev.json | knowledge/evaluation/results/rag_eval_dev.json | e1a8724484f718790a7488a47ce3ec44846a01cd1fa606c294fd394b016a5526 |
| PR-A | evidence/rag_eval_dev.md | knowledge/evaluation/results/rag_eval_dev.md | a39d5872be6eb572488cab67e74823828c82a19ebce927b34df0812e51444722 |
| PR-A | evidence/rag_eval_heldout.csv | knowledge/evaluation/results/rag_eval_heldout.csv | 300b8d1bb6bca560dd06b765a9f52c6804c2ec9e4243616c21228afaf96df1aa |
| PR-A | evidence/rag_eval_heldout.json | knowledge/evaluation/results/rag_eval_heldout.json | 48c6ac29cb884709163c94d65b4fcafb938ae2a6e9045a9dec4c378cbd2463b7 |
| PR-A | evidence/rag_eval_heldout.md | knowledge/evaluation/results/rag_eval_heldout.md | 3e68eb2ea2683d1679bcb95eadbebfa1b1d53ec3c3bcd6a9921c5537a307dc8d |
| PR-A | rag-b1-option-a-ROLLBACK.patch | rag-b1-option-a-ROLLBACK.patch | 7056a89affb7a6f08790c651f25cdfd1c6d139ade5a92ff4566ae523ebbffc7c |
| PR-A | rag-b1-option-a.patch | rag-b1-option-a.patch | 35a7f8f145b377d4668c315a07a9655f53e3dd4418a9f391bcef22756c2d8e7d |
| PR-A | reports/RAG_03_RETRIEVAL_QUALITY_EVALUATION.md | docs/reports/RAG_03_RETRIEVAL_QUALITY_EVALUATION.md | 0d5f3094f4cf9160a0a92fd742bbc0766310d47ec2ce508bc42771d5c06f85b5 |
| PR-A | reports/RAG_B1_CIRCUIT_RETRIEVAL_INVESTIGATION.md | docs/reports/RAG_B1_CIRCUIT_RETRIEVAL_INVESTIGATION.md | 61b0a7a3fd21a32ad3ba11b391ea5c6795c35b185dd8d407b156227a0bb265a0 |
| PR-B | README.md | README.md | c8ce06a1656ad2170287a1b179302e554e39af55afd95445acd473a7137728f6 |
| PR-B | files/apps/api/tests/test_cache_correctness.py | apps/api/tests/test_cache_correctness.py | 0115a046fa34838286e9dc249d3c4f9ba0f7193fbc36e4bd841371d5ac326b50 |
| PR-B | files/apps/api/tests/test_tutor_acceptance.py | apps/api/tests/test_tutor_acceptance.py | 3545e36934e07c5b922a18b0fe61d12e7767410214b315378762c03f0ff46925 |
| PR-B | files/apps/api/tests/test_tutor_run_acceptance_pg.py | apps/api/tests/test_tutor_run_acceptance_pg.py | afd80d797e40d270acc480f3ab4745ba607896cd0777f1b1be317bf974c54d8d |
| PR-B | files/docs/reports/BASELINE_REFRESH_PR13.md | docs/reports/BASELINE_REFRESH_PR13.md | 556d65fe63c67be65ef5b691eb453b6ed4b5053121d0260d0b334dcf7dd5875d |
| PR-B | files/docs/reports/BASELINE_UPDATE_a05a0136_AUDIT.md | docs/reports/BASELINE_UPDATE_a05a0136_AUDIT.md | 1959f2b0b2d86c9735e37a2417bb763204358ee0e47d4ffa9db34cb9004ee2fd |
| PR-B | files/docs/reports/CACHE_BENCHMARK_REPORT.md | docs/reports/CACHE_BENCHMARK_REPORT.md | e64af62279d50887aaad64d912ed7a7ad03fff345a52b5265fe40096d8313732 |
| PR-B | files/docs/reports/CACHE_CORRECTNESS_REPORT.md | docs/reports/CACHE_CORRECTNESS_REPORT.md | 61d3b112deadbcd2bfd75cc20d90d4b953e4961fcb31223826a5f5d10990e3c9 |
| PR-B | files/docs/reports/DOCKER_ACCEPTANCE_REPORT.md | docs/reports/DOCKER_ACCEPTANCE_REPORT.md | 644a967156ef90114123b13efbbf253cecbb82ec56578c9957b28ce275f2ebef |
| PR-B | files/docs/reports/DOCKER_RAG_HANDOFF.md | docs/reports/DOCKER_RAG_HANDOFF.md | de2485cf8bd104103ab3d90a2f725b4b6f8b61d58ea454d6e8eb92995068715f |
| PR-B | files/docs/reports/FINGERPRINT_CLARIFICATION.md | docs/reports/FINGERPRINT_CLARIFICATION.md | b3a25ba725c13a049af2c2e5bded72ea5ecab08482f2579da1fcbc5e9d5fa699 |
| PR-B | files/docs/reports/MUSE_NEXT_STAGE_HANDOFF.md | docs/reports/MUSE_NEXT_STAGE_HANDOFF.md | 50c6521519d41229034cacfc19c7ef8b7a1d6531e567e7ea14ebcfd3468659b6 |
| PR-B | files/docs/reports/PHASE7_IMPLEMENTATION_AUDIT.md | docs/reports/PHASE7_IMPLEMENTATION_AUDIT.md | dcc68000ee38137423128fe2919fdc784c5f22289abead500ceabf023c5ff3b3 |
| PR-B | files/docs/reports/PHASE8_HANDOFF.md | docs/reports/PHASE8_HANDOFF.md | 459e42a5ca78a99ee0a9779f1e09f1071b5d0aea4fb1b9f0aea317df0590fc22 |
| PR-B | files/docs/reports/PR13_CI_WORKFLOW_COMPATIBILITY.md | docs/reports/PR13_CI_WORKFLOW_COMPATIBILITY.md | a4ba633dcd9d413db960d18a98b576d779c15a84a1a2393f598b70da560522ec |
| PR-B | files/docs/reports/RAG_01_SCOPE_ALIGNMENT.md | docs/reports/RAG_01_SCOPE_ALIGNMENT.md | 8458c034c6427d6ca764e0caa0fa76dea1694d219db943fa824920310caf97df |
| PR-B | files/docs/reports/RAG_02_PENDULUM_CONTENT_STANDARDIZATION.md | docs/reports/RAG_02_PENDULUM_CONTENT_STANDARDIZATION.md | 6e27001e4ac462bcb0adeb3660c0eccf634ae2dd2a1d8b68933e713fd28fd16b |
| PR-B | files/docs/reports/RAG_B2_MISSING_EVIDENCE_INVESTIGATION.md | docs/reports/RAG_B2_MISSING_EVIDENCE_INVESTIGATION.md | c6f69ef3784db30d1737232cbe3d51fbdfb74cdc0019f659d6e3edc1684a8776 |
| PR-B | files/docs/reports/RAG_E5_FEASIBILITY_REPORT.md | docs/reports/RAG_E5_FEASIBILITY_REPORT.md | bc48f20255b2c118eee98f3b8517de5b84fddc79a7b8c9f090c95349b5dbfdc5 |
| PR-B | files/docs/reports/REPO_LIVE_STATUS.md | docs/reports/REPO_LIVE_STATUS.md | 695d23806db78431b60e120bd28d58be3ce2e146f2904ca0dcbd96b937bb3fe0 |
| PR-B | files/docs/reports/TUTOR_01_TEMPLATE_ACCEPTANCE.md | docs/reports/TUTOR_01_TEMPLATE_ACCEPTANCE.md | be823bdf141f43019419d75a236f5dfeb3b0f73a76104bb54190b7edd45e2412 |
| PR-B | files/docs/reports/TUTOR_02_WEB_E2E_ACCEPTANCE.md | docs/reports/TUTOR_02_WEB_E2E_ACCEPTANCE.md | 23858fee814f6f3b47451f6744355224225dddef9036c6da5de2107429bebfe4 |
| PR-B | files/docs/reports/TUTOR_03_LLM_PILOT_REPORT.md | docs/reports/TUTOR_03_LLM_PILOT_REPORT.md | 7dd043b9f3b17f393ec2b082b7e828b2bc6aae7047c662a4dbf471f8d3645ca6 |
| PR-B | files/docs/reports/TUTOR_LIVE_PILOT_READINESS.md | docs/reports/TUTOR_LIVE_PILOT_READINESS.md | b87bf574284e877070b72a1ff14ad27b869ca84ac015ea87d62244aab6295a85 |
| PR-B | files/knowledge/evaluation/rag_golden_dev.json | knowledge/evaluation/rag_golden_dev.json | 5849d19144e0e1fc308a0691f170fbc3e4ae27d6347808113be9413befe0f398 |
| PR-B | files/knowledge/evaluation/rag_golden_heldout.json | knowledge/evaluation/rag_golden_heldout.json | 5f1e51cdeed38b5df774b81543f0dd88646d1adecc1ebe85f95feb5ebb8b7790 |
| PR-B | files/knowledge/evaluation/results/baseline-pre-b1/rag_eval_dev.json | knowledge/evaluation/results/baseline-pre-b1/rag_eval_dev.json | b8c665101610d9a721319d23da3cac1e6ba0a2b39012b1f519b7a8609297649b |
| PR-B | files/knowledge/evaluation/results/baseline-pre-b1/rag_eval_dev.md | knowledge/evaluation/results/baseline-pre-b1/rag_eval_dev.md | 8d4e67e41af70d219192d73b03d1a1b8018f3d64c00e354e24b3f73335f841a1 |
| PR-B | files/knowledge/evaluation/results/baseline-pre-b1/rag_eval_heldout.json | knowledge/evaluation/results/baseline-pre-b1/rag_eval_heldout.json | fe3badf1f9d409ef3c9337edc88caaa0086c6d19bd6919eb39d4e07373bf842f |
| PR-B | files/knowledge/evaluation/results/baseline-pre-b1/rag_eval_heldout.md | knowledge/evaluation/results/baseline-pre-b1/rag_eval_heldout.md | 2ca1649a612a7e72981f66007a0d0ea776a3452e7167ef995393239aa8027ffd |
| PR-B | files/knowledge/evaluation/results/cache_benchmark.json | knowledge/evaluation/results/cache_benchmark.json | ade2f290b8c67bf84e687979c862d568b41e367e49672fd62590b798101a354f |
| PR-B | files/knowledge/evaluation/results/tutor_pilot_mock.json | knowledge/evaluation/results/tutor_pilot_mock.json | e38e77290781b68ba4cfd3ccf115b2afd8a21fe68c49e0bd14eb9a751bd90e08 |
| PR-B | files/scripts/cache_benchmark.py | scripts/cache_benchmark.py | 0ce60f938b5e347c35bf88a28b99651094c8f42fa6b6136579cbd470ebd8c467 |
| PR-B | files/scripts/rag_b1_experiment.py | scripts/rag_b1_experiment.py | eec48b113ce15917840acb03fc9464a30d26a605d0ed38e69f254fbb8d6eba1f |
| PR-B | files/scripts/rag_evaluation.py | scripts/rag_evaluation.py | f1d8458d6237085b68e4a318e61648ccd6dbed73263631ddd182074121911a72 |
| PR-B | files/scripts/tutor_pilot_mock.py | scripts/tutor_pilot_mock.py | 307c5b7179f4cb1262ccfd1a7966e00108de0bb878f6b51a74fe8a8312f7dd0e |
| PR-B | files/tests/e2e/tutor-acceptance.spec.ts | tests/e2e/tutor-acceptance.spec.ts | 43018c2bccb49f3d6a7e56fc2984dd143d9ebf685ea044d1d2ca6cdd7372546e |

Cross-bundle destination overlap (excluding bundle-internal README/patch files): 0
