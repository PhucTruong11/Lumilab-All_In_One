import { useEffect, useRef, useState } from 'react';
import type { LabId } from '@lumilab/lab-engine';
import { loadLabPreview } from '../api';
import { downloadText } from '../data/learning';
import { historyLimit, readRunHistory, runHistoryKey, saveDraftRun, type DraftLabRun } from '../runHistory';
import { LabServerHistory } from './LabServerHistory';
import { useLab } from '../labSession';

const highlights: Record<LabId, [key: string, label: string, unit: string][]> = {
  pendulum: [['period_s', 'Chu kỳ', 's'], ['max_speed_m_s', 'Tốc độ tối đa', 'm/s']],
  chemistry: [['pH', 'pH', ''], ['salt', 'Muối tạo thành', '']],
  circuit: [['current_A', 'Dòng điện', 'A'], ['totalResistance_ohm', 'Tổng điện trở', 'Ω']],
  mechanics: [['acceleration_m_s2', 'Gia tốc', 'm/s²'], ['position_m', 'Vị trí', 'm']],
  spring: [['period_s', 'Chu kỳ', 's'], ['displacement_m', 'Li độ', 'm']],
  electrochemistry: [['meterVoltage_V', 'Điện áp đo', 'V'], ['emf_V', 'Suất điện động', 'V']],
  'parallel-circuit': [['totalCurrent_A', 'Dòng toàn mạch', 'A'], ['equivalentResistance_ohm', 'Điện trở tương đương', 'Ω']],
  capacitor: [['capacitorVoltage_V', 'Điện áp tụ', 'V'], ['timeConstant_s', 'Hằng số thời gian', 's']],
  precipitation: [['precipitateMass_g', 'Khối lượng AgCl', 'g']],
  'gas-reaction': [['carbonDioxideVolume_ml', 'Thể tích CO₂', 'mL']],
  'spring-damped': [["displacement_m", "Li độ", "m"], ["energy_J", "Cơ năng", "J"]],
  'inclined-plane': [["state", "Trạng thái", ""], ["acceleration_m_s2", "Gia tốc", "m/s²"]],
  'pulley': [["pull_N", "Lực kéo", "N"], ["rope_m", "Dây cần kéo", "m"]],
  'alkali-water': [["appearance", "Quan sát", ""], ["product", "Sản phẩm", ""]],
  'copper-nitric': [["appearance", "Quan sát", ""], ["product", "Sản phẩm", ""]],
  'chlorine-bleach': [["appearance", "Quan sát", ""], ["product", "Sản phẩm", ""]],
  atomic: [['symbol', 'Nguyên tố', ''], ['massNumber', 'Số khối', ''], ['charge_e', 'Điện tích', 'e']],
};
const numberFormat = new Intl.NumberFormat('vi-VN', { maximumSignificantDigits: 8 });

export function LabServerPreview({ id }: { id: LabId }) {
  const { engine, state } = useLab(id);
  const active = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DraftLabRun | null>(null);
  const [storageNotice, setStorageNotice] = useState('');
  const [history, setHistory] = useState<DraftLabRun[]>([]);

  useEffect(() => {
    function refresh() {
      try {
        setHistory(readRunHistory(id));
        setStorageNotice('');
      } catch {
        setHistory([]);
        setStorageNotice('Không đọc được lịch sử trên trình duyệt này.');
      }
    }
    function sync(event: StorageEvent) {
      if (event.key === runHistoryKey(id) || event.key === null) refresh();
    }
    refresh();
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
      active.current?.abort();
      active.current = null;
    };
  }, [id]);

  async function calculate() {
    if (active.current) return;
    const snapshot = engine.snapshot();
    const controller = new AbortController();
    active.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    setPending(true);
    setError('');
    setResult(null);
    try {
      const input = {
        parameters: snapshot.parameters, elapsed_s: snapshot.elapsed_s,
        model_version: engine.modelVersion, dataset_version: engine.definition.dataset_version,
      };
      const { requestId, values } = await loadLabPreview(id, input, controller.signal);
      if (active.current === controller) {
        const run: DraftLabRun = {
          ...input, schema_version: 1, lab_id: id, request_id: requestId,
          saved_at: new Date().toISOString(), status: 'INSUFFICIENT_DATA',
          code: 'REVIEWED_EVIDENCE_REQUIRED', preview: values,
        };
        setResult(run);
        try {
          setHistory(saveDraftRun(run));
          setStorageNotice('');
        } catch {
          setStorageNotice('Có kết quả xem trước nhưng không lưu được lượt này trên trình duyệt.');
        }
      }
    } catch (cause) {
      if (active.current === controller) {
        setError(controller.signal.aborted ? 'Máy chủ phản hồi quá lâu. Hãy thử lại.' :
          cause instanceof TypeError || cause instanceof SyntaxError ? 'Không kết nối được API. Hãy kiểm tra backend và thử lại.' :
          cause instanceof Error ? cause.message : 'Không tải được bản xem trước. Hãy thử lại.');
      }
    } finally {
      window.clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }

  const historical = result && (result.parameters !== state.parameters || result.elapsed_s !== state.elapsed_s);
  return <section className="learning-journey" aria-label="Kết quả tính lại từ máy chủ">
    <div className="journey-body">
      <div className="journey-links">
        <button className="secondary-button" onClick={calculate} disabled={pending}>Tính lại trên máy chủ</button>
        <strong>Dữ liệu chưa duyệt</strong>
      </div>
      {storageNotice && <p role="status">{storageNotice}</p>}
      {pending && <p role="status">Đang tính lại…</p>}
      {error && <p role="alert">{error}</p>}
      {result && <div aria-label="Bản xem trước từ máy chủ" role="status">
        <strong>Bản xem trước từ máy chủ</strong>
        <p>Thời điểm chụp: {numberFormat.format(result.elapsed_s)} s.{historical && ' Đây là kết quả của lượt đã gửi. Hãy tính lại để xem lượt hiện tại.'}</p>
        <dl>{highlights[id].map(([key, label, unit]) => {
          const value = result.preview[key];
          return <div key={key}><dt>{label}</dt><dd>{value == null ? '—' : [
            typeof value === 'number' ? numberFormat.format(value) : String(value), unit,
          ].filter(Boolean).join(' ')}</dd></div>;
        })}</dl>
        <details><summary>Xem toàn bộ số liệu máy chủ</summary>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(result.preview, null, 2)}</pre>
        </details>
      </div>}
      <details>
        <summary>Lịch sử lượt thử ({history.length}/{historyLimit})</summary>
        <p>Lượt có preview từ máy chủ được lưu tự động trên trình duyệt này.</p>
        {!history.length && <p>Chưa có lượt thử được lưu.</p>}
        {!!history.length && <button className="secondary-button" onClick={() =>
          downloadText('LumiLab-' + id + '-preview-history.json', JSON.stringify(history, null, 2), 'application/json')
        }>Tải lịch sử JSON</button>}
        <ol>{history.map(run => <li key={run.request_id}>
          <details>
            <summary><time dateTime={run.saved_at}>{new Date(run.saved_at).toLocaleString('vi-VN')}</time>
              {' · Dữ liệu chưa duyệt'}</summary>
            <p>Mô hình {run.model_version} · Dữ liệu {run.dataset_version} · Thời điểm mô phỏng {numberFormat.format(run.elapsed_s)} s</p>
            <p>Thông số đã gửi</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(run.parameters, null, 2)}</pre>
            <p>Preview đã lưu</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(run.preview, null, 2)}</pre>
          </details>
        </li>)}</ol>
      </details>
      <LabServerHistory id={id} preview={result}/>
    </div>
  </section>;
}
