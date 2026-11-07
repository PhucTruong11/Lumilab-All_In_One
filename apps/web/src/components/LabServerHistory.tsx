import { useEffect, useState } from 'react';
import type { LabId } from '@lumilab/lab-engine';
import type { DraftLabRun } from '../runHistory';
import { listServerRuns, saveServerRun, type ServerRun } from '../serverRuns';
import { ServerReadingDetails } from './ServerReadingDetails';

function message(error: unknown) {
  if (error instanceof Error && error.name === 'Error') return error.message;
  return 'Không truy cập được lịch sử máy chủ. Hãy thử lại.';
}

export function LabServerHistory({ id, preview }: { id: LabId; preview: DraftLabRun | null }) {
  const [items, setItems] = useState<ServerRun[]>([]);
  const [offset, setOffset] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [savedRequest, setSavedRequest] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    listServerRuns(id, 0, AbortSignal.any([controller.signal, AbortSignal.timeout(8000)])).then(page => {
      if (!controller.signal.aborted) {
        setItems(page.items);
        setOffset(page.next_offset);
      }
    }).catch(cause => {
      if (!controller.signal.aborted) setError(message(cause));
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [id]);

  async function refresh(from: number) {
    setBusy(true);
    setError('');
    try {
      const page = await listServerRuns(id, from);
      setItems(previous => from === 0 ? page.items : [
        ...previous, ...page.items.filter(item => !previous.some(old => old.run_id === item.run_id)),
      ]);
      setOffset(page.next_offset);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!preview || busy) return;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const run = await saveServerRun(preview);
      setSavedRequest(preview.request_id);
      setItems(previous => [run, ...previous.filter(item => item.run_id !== run.run_id)]);
      setNotice('Đã lưu lượt thử theo phiên trên máy chủ.');
      await refresh(0);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label="Lịch sử theo phiên trên máy chủ">
    <details>
      <summary>Lịch sử theo phiên trên máy chủ</summary>
      <p>Phiên ẩn danh có hiệu lực 7 ngày. Giữ tab này để mở lại lịch sử sau khi tải lại trang.</p>
      <div className="journey-links">
        <button className="secondary-button" disabled={busy || !preview || preview.request_id === savedRequest}
          onClick={save}>Lưu lượt này lên máy chủ</button>
        <button className="secondary-button" disabled={busy} onClick={() => refresh(0)}>Tải lại lịch sử máy chủ</button>
      </div>
      {busy && <p role="status">Đang xử lý lịch sử máy chủ…</p>}
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      {!busy && !error && !items.length && <p>Phiên này chưa có lượt thử cho lab này.</p>}
      {!!items.length && <ol>{items.map(run => <li key={run.run_id}>
        <details>
          <summary><time dateTime={run.saved_at}>{new Date(run.saved_at).toLocaleString('vi-VN')}</time>
            {run.result.status === 'VERIFIED' ? ' · Đã kiểm chứng (VERIFIED)' : ' · Dữ liệu chưa duyệt'}</summary>
          <p>Mô hình {run.input.model_version} · Dữ liệu {run.input.dataset_version} · {run.input.elapsed_s} s</p>
          <p>Thông số đã gửi</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(run.input.parameters, null, 2)}</pre>
          <p>Preview đã lưu trên máy chủ</p>
          {run.result.preview && <ServerReadingDetails reading={run.result.preview} />}
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(run.result.preview, null, 2)}</pre>
        </details>
      </li>)}</ol>}
      {offset !== null && <button className="secondary-button" disabled={busy} onClick={() => refresh(offset)}>Xem lượt cũ hơn</button>}
    </details>
  </section>;
}
