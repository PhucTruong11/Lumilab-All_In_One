import { useEffect, useState } from 'react';
import { labDefinitions, type LabId, type ParameterMap } from '@lumilab/lab-engine';
import source from '../data/physics-tasks.json';
import { lessons } from '../data/learning';
import { useLab } from '../labSession';
import { Exercise } from './LessonLibrary';

export function PhysicsTaskPanel({ id, selectedId, onSelect }: {
  id: LabId; selectedId?: string; onSelect: (taskId?: string) => void;
}) {
  const { engine } = useLab(id);
  const [open, setOpen] = useState(Boolean(selectedId));
  const [notice, setNotice] = useState('');
  const activities = source.tasks.filter(task => task.runtime_id === id);
  const lesson = lessons.find(item => item.id === id && item.subjectId === 'physics');
  const exerciseId = lesson?.exercise.id;
  const activity = activities.find(task => task.id === selectedId);
  const exerciseSelected = selectedId === exerciseId;

  useEffect(() => { if (selectedId) setOpen(true); }, [selectedId]);
  useEffect(() => { setNotice(''); }, [selectedId, id]);
  if (!lesson) return null;

  function choose(taskId?: string) {
    onSelect(taskId);
    setOpen(Boolean(taskId));
  }

  function apply(parameters: object) {
    try {
      engine.setParameters({ ...labDefinitions[id].defaults, ...parameters } as Partial<ParameterMap[LabId]>);
      setNotice('Đã áp dụng thông số mặc định và ca mẫu. Các số đo cũ vẫn nằm trong sổ tay của phiên.');
    } catch {
      setNotice('Không áp dụng được thông số mẫu cho phiên bản lab này. Hãy kiểm tra lại bài.');
    }
  }

  return <section className="lab-task-area" aria-label="Bài tập thực hành">
    <nav className="lab-task-tabs" aria-label="Cách thực hành">
      <button type="button" aria-pressed={!open} onClick={() => choose()}>Mô phỏng tự do</button>
      <button type="button" aria-pressed={open} onClick={() => setOpen(true)}>Bài tập thực hành</button>
    </nav>
    {open && <div className="lab-task-panel">
      <div className="lab-task-heading"><div><h2>Chọn bài để làm</h2><p>Đề bài ở ngay trong phòng thực hành; mô phỏng bên dưới luôn dùng được.</p></div>
        <label> Bài tập
          <select
            aria-label="Chọn bài tập thực hành"
            value={selectedId || ''}
            onChange={event => choose(event.target.value || undefined)}
            onKeyDown={event => {
              const allValues = ['', ...activities.map(t => t.id), ...(exerciseId ? [exerciseId] : [])];
              const currentIndex = allValues.indexOf(selectedId || '');
              if (event.key === 'ArrowDown') {
                const nextIndex = Math.min(currentIndex + 1, allValues.length - 1);
                choose(allValues[nextIndex] || undefined);
              } else if (event.key === 'ArrowUp') {
                const prevIndex = Math.max(currentIndex - 1, 0);
                choose(allValues[prevIndex] || undefined);
              }
            }}
          >
            <option value="">Chọn một bài</option>
            {activities.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
            <option value={exerciseId}>{lesson.title} · Bài tính</option>
          </select>
        </label>
      </div>
      {selectedId && !activity && !exerciseSelected && <p role="alert">Bài này không thuộc thí nghiệm hiện tại. Hãy chọn bài trong danh sách.</p>}
      {activity && <div className="lab-task-brief" key={activity.id}>
        <h3>{activity.title}</h3>
        <p><strong>Điều kiện ban đầu:</strong> {activity.initial_state}</p>
        <p><strong>Yêu cầu:</strong> {activity.actions}</p>
        <div className="lab-task-actions">{activity.cases.map((sample, index) => <button type="button" className="secondary-button" key={index}
          onClick={() => apply(sample.parameters)}>Áp dụng ca {index + 1} · đọc tại {sample.elapsed_s.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} s</button>)}</div>
        <p className="content-note">Thay thông số trên bàn thí nghiệm, ghi số đo và giải thích kết quả. Mỗi ca mẫu bắt đầu ở thời điểm 0 s; chạy mô phỏng tới thời điểm đề yêu cầu.</p>
        <details><summary>Gợi ý và kết quả tham khảo</summary><p>{activity.feedback_on_failure}</p><p>{activity.expected_result}</p></details>
      </div>}
      {exerciseSelected && <Exercise key={exerciseId} lesson={lesson} />}
      <p className="content-note">Học liệu đang ở trạng thái nháp; số đọc mô phỏng không phải kết quả đã chứng nhận.</p>
      <p role="status" className="inline-notice">{notice}</p>
    </div>}
  </section>;
}
