import { useEffect, useState } from 'react';

type ApiStatus = 'Đang kiểm tra API…' | 'API sẵn sàng' | 'API chưa chạy';

export function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('Đang kiểm tra API…');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable');
        setApiStatus('API sẵn sàng');
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setApiStatus('API chưa chạy');
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="shell">
      <div className="brand">LUMILAB <span>B</span></div>
      <p className="eyebrow">Phòng thí nghiệm ảo · Khung ứng dụng</p>
      <h1>Học bằng dự đoán, thử nghiệm và bằng chứng.</h1>
      <p className="intro">
        Nền tảng đã sẵn sàng để thêm từng bài thực hành Vật lý và Hóa học.
        Các lab và Lumi sẽ xuất hiện khi được tích hợp và kiểm tra tại repo này.
      </p>
      <div className="status" role="status" aria-live="polite">
        <span className="dot" aria-hidden="true" />
        {apiStatus}
      </div>
    </main>
  );
}
