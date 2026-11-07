# Baseline RAG và LLM của LumiLab B

Đo ngày **07/11/2026**, tại commit `b7e333bbea747bd71dfed00dfc45fa173e5b592f` với workspace sạch. Dùng corpus draft `authored-ctst-reference-draft-2026-11-06` và embedding `token-hash-v1-512` trên bộ nhớ local. Các tập câu hỏi được chuyển từ A. Phạm vi CTST ghi trong corpus lịch sử vẫn cần được đối chiếu với bộ Kết nối tri thức mà nhóm chọn cho B. [Dataset B](DATASET.md) · [Kết quả lịch sử A](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/BENCHMARK-AND-DATA.md)

## Kết quả retrieval local

| Tập | Hybrid tìm đúng trong top 3 | Hybrid từ chối đúng ngoài phạm vi | Hybrid p50 |
| --- | ---: | ---: | ---: |
| Dev | 22/24 | 6/6 | 0,296 ms |
| Challenge-08 | 16/18 | 6/6 | 0,290 ms |
| THCS scope | 12/12 | 5/6 | 0,305 ms |
| CTST | 13/13 | 3/3 | 0,369 ms |

BM25 và hybrid có cùng số hit và số từ chối đúng trên cả bốn tập; p50 của BM25 khoảng 0,05–0,07 ms trong lần đo này. Vector hash đơn lẻ tìm đúng 15/24 trên dev và 10/18 trên challenge. `hybrid_tools` dùng cùng retrieval trong harness. Các thời gian chỉ tính truy vấn local sau khi tạo chỉ mục, chưa gồm HTTP, build index hoặc suy luận LLM. Các tập có thể trùng nội dung và từng dùng trong phát triển. Giữ kết quả theo từng tập khi so sánh.

Ca hybrid cần xem lại gồm `pendulum-retrieval-04`, `pendulum-retrieval-05`, `challenge-01`, `challenge-10` và ca ngoài phạm vi THCS `thcs-pendulum-ood` đã trả nhầm thẻ.

## Luật chặn prompt injection và kiểm gateway

| Tập | Phát hiện tấn công | Chặn nhầm câu bình thường |
| --- | ---: | ---: |
| `injection-vi-dev` | 24/24 | 0/24 |
| `injection-challenge-08` | 20/20 | 0/20 |

Kết quả đo **luật local** trên dữ liệu phát triển. Benchmark runner, live runner, gateway, fallback và adapter HTTP có **62 test đạt, 2 bỏ qua** với provider giả. Độ chính xác và độ trễ của model thật trên B vẫn `NOT_RUN`. [Kết quả lịch sử live và điều kiện chạy](LIVE-LLM-EVALUATION.md)

## Tái lập benchmark offline

Chạy từ root repo với venv của API. Báo cáo JSON ghi SHA của tập câu hỏi, revision corpus, fingerprint chỉ mục, kết quả từng ca và git SHA. Báo cáo lần đo này nằm trong `.local/evaluation/llm-baseline-b/`.

```powershell
$env:LUMILAB_RETRIEVAL_EMBEDDER = 'hash'
$env:LUMILAB_RETRIEVAL_STORE = 'memory'
$out = '.local/evaluation/llm-baseline-b'
foreach ($suite in @('retrieval-dev', 'retrieval-challenge-08', 'retrieval-thcs-scope', 'retrieval-ctst')) {
    .\.venv\Scripts\python.exe -m lumilab_api.evaluation retrieval --cases "knowledge/evaluation/$suite.json" --output "$out/$suite.json"
    if ($LASTEXITCODE) { throw "Retrieval benchmark failed: $suite" }
}
foreach ($suite in @('injection-vi-dev', 'injection-challenge-08')) {
    .\.venv\Scripts\python.exe -m lumilab_api.guard_evaluation --cases "knowledge/evaluation/$suite.json" --output "$out/$suite.json"
    if ($LASTEXITCODE) { throw "Guard benchmark failed: $suite" }
}
```
