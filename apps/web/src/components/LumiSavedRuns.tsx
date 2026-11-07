import { useEffect, useState } from 'react';
import { isLabId } from '@lumilab/lab-engine';
import { listServerRuns, type ServerRun } from '../serverRuns';

export function LumiSavedRuns({ lessonId, selected, onSelect, disabled }: {
  lessonId: string; selected: string; onSelect: (id: string) => void; disabled: boolean;
}) {
  const [items, setItems] = useState<ServerRun[]>([]);
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!isLabId(lessonId)) return;
    const controller = new AbortController();
    listServerRuns(lessonId, 0, AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]))
      .then(page => {
        if (!controller.signal.aborted) {
          setItems(page.items);
          setNotice(page.items.length ? 'Chọn trong 20 lượt gần nhất của phiên này.' : 'Phiên này chưa có lượt đã lưu cho bài đang hỏi.');
        }
      }).catch(() => {
        if (!controller.signal.aborted) {
          setItems([]);
          setNotice('Không đọc được lịch sử phiên. Hãy tải lại danh sách.');
        }
      });
    return () => controller.abort();
  }, [lessonId, refresh]);

  return <div className="lumi-tools">
    <label>Lượt đã lưu trên máy chủ <select aria-label="Lượt đã lưu trên máy chủ" value={selected}
      disabled={disabled} onChange={event => onSelect(event.target.value)}>
      <option value="">Không đính kèm lượt đã lưu</option>
      {items.filter(run => run.lab_id === lessonId).map((run, index) =>
        <option key={run.run_id} value={run.run_id}>
          {index + 1} · {new Date(run.saved_at).toLocaleString('vi-VN')} · Dữ liệu chưa duyệt
        </option>)}
    </select></label>
    <button className="text-button" disabled={disabled} onClick={() => {
      onSelect(''); setRefresh(value => value + 1);
    }}>Tải lại lượt đã lưu</button>
    <small role="status">{notice}</small>
  </div>;
}
