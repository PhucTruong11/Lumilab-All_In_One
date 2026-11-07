import { useEffect, useState } from 'react';
import type { LabDefinition } from '@lumilab/contracts';
import { loadLabs } from '../api';

export function LessonCatalog() {
  const [labs, setLabs] = useState<LabDefinition[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<LabDefinition | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let active = true;
    setState('loading');
    loadLabs(controller.signal).then(items => {
      if (active) { setLabs(items); setState('ready'); }
    }).catch((cause: unknown) => {
      if (active) {
        setError(cause instanceof Error && cause.name !== 'AbortError' ? cause.message : 'API chưa phản hồi. Kiểm tra backend rồi thử lại.');
        setState('error');
      }
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [reload]);
  return <section className="catalog-view" aria-labelledby="catalog-title"><div className="workspace-heading"><div><p className="breadcrumb">Nội dung học tập</p><h1 id="catalog-title">Thư viện bài học</h1><p>Cấu hình bài học từ API. Nội dung đang chờ duyệt.</p></div><span role="status">{state === 'loading' ? 'Đang kết nối API…' : state === 'ready' ? 'Đã tải catalog từ API' : 'API chưa sẵn sàng'}</span></div>
    {state === 'error' && <div role="alert" className="error"><p>{error}</p><button className="primary-button" onClick={() => setReload(value => value + 1)}>Thử kết nối lại</button></div>}
    {state === 'ready' && labs.length === 0 && <p>Chưa có cấu hình bài học.</p>}
    <div className="catalog-grid">{labs.map(lab => <article key={lab.id} className={`lesson-card ${lab.domain}`}><span className="subject">{lab.domain === 'physics' ? 'Vật lí' : 'Hóa học'}</span><h2>{lab.title}</h2><p>{lab.summary}</p><div className="card-footer"><span>Cấu hình nháp</span><button className="secondary-button" onClick={() => setSelected(lab)}>Xem cấu hình</button></div></article>)}</div>
    {selected && <section className="config"><div className="panel-title"><h2>Cấu hình: {selected.title}</h2><button className="text-button" onClick={() => setSelected(null)}>Đóng</button></div><p>Model {selected.model_version} · Học liệu đang chờ duyệt</p><ul>{Object.entries(selected.parameters).map(([key, parameter]) => <li key={key}>{key}: {parameter.min}–{parameter.max} {parameter.unit}; mặc định {parameter.default}</li>)}</ul></section>}
  </section>;
}
