# Cache Benchmark Report — Lumilab-All_In_One (PHASE VII, Stage 5)

**Phương pháp:** Script `scripts/cache_benchmark.py` — provider **giả lập** với độ trễ cố định 120ms (không phải provider thật, không phát sinh chi phí), chạy qua chính `Gateway` production với cache in-memory LRU 128 / TTL 600s, 1 worker, 40 câu hỏi phân biệt trong cùng một session: lượt 1 (cold, toàn miss) → lượt 2 (warm, kỳ vọng toàn hit). Kết quả thô: `knowledge/evaluation/results/cache_benchmark.json`. Chạy sau khi Stage 2 (cache correctness) đạt 13/13.

| Chỉ số | Giá trị đo |
|---|---|
| Cold latency p50 | **124.49 ms** |
| Cold latency p95 | **127.37 ms** |
| Warm latency p50 | **2.26 ms** |
| Warm latency p95 | **2.89 ms** |
| Cache hit rate (lượt warm) | **1.0** (40/40) |
| Provider calls ở lượt cold | 40 |
| Provider calls tiết kiệm ở lượt warm | **40** |
| Tăng tốc p50 (cold/warm) | **55.2×** |

Warm latency ~2.3ms là chi phí lắp prompt + tra cache trong tiến trình (không có I/O mạng) — đúng kỳ vọng cho cache in-memory. Số liệu này là **mock**: độ trễ tuyệt đối của provider thật sẽ khác; kết luận được phép rút ra là cache hoạt động đúng cơ chế (hit toàn phần, tiết kiệm 100% lời gọi lặp) và chi phí tra cứu không đáng kể so với bất kỳ độ trễ provider thực tế nào.
