import { useRef, useState } from 'react';
import { isLabId, type LabId } from '@lumilab/lab-engine';
import { downloadText, lessonById, lessons, readLocal, subjects, type Question } from '../data/learning';
import { askServerTutor } from '../serverRuns';

interface Draft { title: string; lessonId: string; goal: string; minutes: number; notes: string }
interface AiHint { source: string; message: string; followUp?: string | null; citations: string[] }
const initial: Draft = { title: 'Khám phá chu kỳ con lắc', lessonId: 'pendulum', goal: 'Kiểm tra chiều dài và khối lượng ảnh hưởng thế nào đến chu kỳ.', minutes: 20, notes: '' };
const isDraft = (v: unknown): v is Draft => !!v && typeof v === 'object' && 'title' in v && typeof v.title === 'string' && v.title.length <= 120 && 'lessonId' in v && lessons.some(l => l.id === v.lessonId) && 'goal' in v && typeof v.goal === 'string' && v.goal.length <= 1000 && 'minutes' in v && typeof v.minutes === 'number' && v.minutes >= 5 && v.minutes <= 90 && 'notes' in v && typeof v.notes === 'string' && v.notes.length <= 3000;

function resolvePilotLab(lessonId: string, text: string, subjectId: string): string {
  if (lessonId === 'pendulum' || lessonId === 'circuit' || lessonId === 'chemistry') return lessonId;
  if (subjectId === 'chemistry' || /chuẩn độ|axit|bazơ|hcl|naoh|ph\b|kết tủa|khí|điện phân|nguyên tử|clo|hno3|kiềm/i.test(text)) return 'chemistry';
  if (lessonId === 'parallel-circuit' || lessonId === 'capacitor' || /mạch|điện|ampe|vôn|ohm|ôm|song song|nối tiếp|tụ điện/i.test(text)) return 'circuit';
  return 'pendulum';
}

export function LearningWorkspace({ openLab }: { openLab: (id: LabId) => void }) {
  const imported = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'practice' | 'quiz'>('practice');
  const [draft, setDraft] = useState<Draft>(() => readLocal('lumilab-practice-v2', initial, isDraft));
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [subjectId, setSubjectId] = useState('physics');
  const [chapterId, setChapterId] = useState('all');
  const [count, setCount] = useState(4);
  const [quizTitle, setQuizTitle] = useState('Kiểm tra nhanh kiến thức');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [practiceAi, setPracticeAi] = useState<AiHint | null>(null);
  const [practiceAiLoading, setPracticeAiLoading] = useState(false);
  const [quizAi, setQuizAi] = useState<Record<string, AiHint>>({});
  const [quizAiLoading, setQuizAiLoading] = useState<string | null>(null);

  const subject = subjects.find(item => item.id === subjectId)!;
  const selectedLesson = lessonById(draft.lessonId);
  const pool = lessons.filter(item => item.subjectId === subjectId && (chapterId === 'all' || item.chapterId === chapterId)).flatMap(item => item.quiz);
  const practiceText = `${draft.title}\nBài học: ${selectedLesson.title}\nThời lượng: ${draft.minutes} phút\nMục tiêu: ${draft.goal}\n\n1. Dự đoán: ${selectedLesson.lead}\n2. Thực hiện: đọc học liệu, xác định các đại lượng và điều kiện. Nếu có lab, thay một yếu tố và ghi hai kết quả.\n3. Giải thích: dùng số liệu hoặc kiến thức bài học để đối chiếu dự đoán.\n4. Vận dụng: ${selectedLesson.exercise.prompt}\n\nGhi chú: ${draft.notes}`;
  const quizText = (key: boolean) => `${quizTitle}\nMôn: ${subject.name}\n\n` + questions.map((q, i) => `${i + 1}. ${q.stem}\n${q.options.map((option, j) => `${String.fromCharCode(65 + j)}. ${option}`).join('\n')}${key ? `\nĐáp án: ${String.fromCharCode(65 + q.correctIndex)}. ${q.explanation}` : ''}`).join('\n\n');

  async function requestPracticeAi() {
    if (practiceAiLoading || !draft.goal.trim()) return;
    setPreview(true);
    setPracticeAiLoading(true);
    try {
      const lab = resolvePilotLab(draft.lessonId, `${draft.title} ${draft.goal}`, selectedLesson.subjectId);
      const res = await askServerTutor({
        lab_id: lab,
        question: `${selectedLesson.title}. Mục tiêu hoạt động: ${draft.goal}`.slice(0, 600),
        mode: 'qa',
        hint_level: 1,
        run_id: null,
        include_drafts: true,
        level: 'THPT',
        history: [],
      }, AbortSignal.timeout(20000));
      setPracticeAi({
        source: res.answer.response_source === 'llm' ? 'LLM · ' + res.answer.model : res.answer.response_source === 'cache' ? 'Phản hồi lưu đệm' : 'Hướng dẫn theo mẫu',
        message: res.answer.output.message,
        followUp: res.answer.output.follow_up,
        citations: res.answer.output.citation_ids ?? [],
      });
    } catch {
      setPracticeAi({ source: 'Gia sư ngoại tuyến', message: 'Chưa kết nối được Gia sư máy chủ. Hãy dùng gợi ý 4 bước bên dưới.', citations: [] });
    } finally {
      setPracticeAiLoading(false);
    }
  }

  async function requestQuizAi(q: Question) {
    if (quizAiLoading) return;
    setQuizAiLoading(q.id);
    try {
      const lab = resolvePilotLab('', q.stem, subjectId);
      const res = await askServerTutor({
        lab_id: lab,
        question: q.stem.slice(0, 600),
        mode: 'hint',
        hint_level: 2,
        run_id: null,
        include_drafts: true,
        level: 'THPT',
        history: [],
      }, AbortSignal.timeout(20000));
      setQuizAi(prev => ({
        ...prev,
        [q.id]: {
          source: res.answer.response_source === 'llm' ? 'LLM · ' + res.answer.model : res.answer.response_source === 'cache' ? 'Phản hồi lưu đệm' : 'Hướng dẫn theo mẫu',
          message: res.answer.output.message,
          followUp: res.answer.output.follow_up,
          citations: res.answer.output.citation_ids ?? [],
        },
      }));
    } catch {
      setQuizAi(prev => ({ ...prev, [q.id]: { source: 'Gia sư ngoại tuyến', message: 'Không gọi được gợi ý AI lúc này.', citations: [] } }));
    } finally {
      setQuizAiLoading(null);
    }
  }

  return <section className="learning-page"><div className="workspace-heading"><div><p className="breadcrumb">Cho người dạy và người học</p><h1>Không gian học tập</h1><p>Chuẩn bị một hoạt động, tạo câu hỏi và cùng khám phá.</p></div><div className="segmented"><button aria-pressed={tab === 'practice'} onClick={() => { setTab('practice'); setNotice(''); }}>Soạn thực hành</button><button aria-pressed={tab === 'quiz'} onClick={() => { setTab('quiz'); setNotice(''); }}>Tạo quiz</button></div></div>
    {tab === 'practice' ? <div className="workspace-editor"><form className="editor-panel" onSubmit={event => { event.preventDefault(); if (!draft.title.trim() || !draft.goal.trim() || !isDraft(draft)) { setNotice('Hãy nhập tên, mục tiêu và thời lượng hợp lệ.'); return; } setPreview(true); }}><div className="panel-title"><h2>Thiết kế hoạt động</h2><button type="button" className="text-button" onClick={() => imported.current?.click()}>Nhập bản nháp</button></div><input hidden ref={imported} type="file" accept=".json,application/json" aria-label="Tệp bản nháp hoạt động" onChange={async event => { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; try { if (file.size > 20000) throw new Error('Large file'); const value: unknown = JSON.parse((await file.text()).replace(/^\uFEFF/, '')); if (!isDraft(value) || !value.title.trim() || !value.goal.trim()) throw new Error('Invalid draft'); setDraft(value); setPreview(true); setNotice('Đã nhập bản nháp. Bấm Lưu để giữ trên máy.'); } catch { setNotice('Tệp bản nháp không hợp lệ. Nội dung đang soạn được giữ nguyên.'); } finally { input.value = ''; } }}/>
      <label className="field">Tên hoạt động<input value={draft.title} maxLength={120} required onChange={event => setDraft({ ...draft, title: event.target.value })}/></label>
      <div className="field-row">
        <label className="field">Bài học<select value={draft.lessonId} onChange={event => { const item = lessonById(event.target.value); setDraft({ ...draft, lessonId: item.id, title: item.title, goal: item.lead }); setPracticeAi(null); }}>{lessons.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label className="field field-narrow">Thời lượng (phút)<input type="number" min={5} max={90} required value={draft.minutes} onChange={event => setDraft({ ...draft, minutes: Number(event.target.value) })}/></label>
      </div>
      <label className="field">Mục tiêu<textarea required rows={2} value={draft.goal} maxLength={1000} onChange={event => setDraft({ ...draft, goal: event.target.value })}/></label>
      <label className="field">Ghi chú tổ chức<textarea rows={2} value={draft.notes} maxLength={3000} placeholder="Làm cá nhân, theo nhóm, câu hỏi cần lưu ý…" onChange={event => setDraft({ ...draft, notes: event.target.value })}/></label>
      <div className="button-row">
        <button className="primary-button">Tạo khung hoạt động</button>
        <button type="button" className="secondary-button" onClick={() => { if (!isDraft(draft) || !draft.title.trim() || !draft.goal.trim()) { setNotice('Hãy nhập tên, mục tiêu và thời lượng từ 5 đến 90 phút.'); return; } try { localStorage.setItem('lumilab-practice-v2', JSON.stringify(draft)); setNotice('Đã lưu bản nháp trên máy này.'); } catch { setNotice('Không lưu được bản nháp. Bạn có thể tải nội dung về máy.'); } }}>Lưu bản nháp</button>
        <button type="button" className="secondary-button ai-action-btn" disabled={practiceAiLoading} onClick={requestPracticeAi}>{practiceAiLoading ? 'Đang hỏi Lumi AI…' : '✦ Gợi ý AI'}</button>
      </div>
    </form><section className="preview-panel"><div className="panel-title"><h2>Bản xem trước</h2>{preview && <div className="button-row compact-row"><button className="text-button" onClick={() => downloadText('LumiLab-hoat-dong.txt', practiceText)}>Tải hoạt động</button><button className="secondary-button" onClick={() => downloadText('LumiLab-ban-nhap.json', JSON.stringify(draft, null, 2))}>Xuất bản nháp</button>{isLabId(draft.lessonId) && <button className="primary-button" onClick={() => openLab(draft.lessonId as LabId)}>Mở lab của hoạt động</button>}</div>}</div>{preview ? <>
      <div className="preview-header-meta"><span className="soft-tag">{draft.minutes} phút · {selectedLesson.subjectId === 'physics' ? 'Vật lí' : 'Hóa học'}</span><h3>{draft.title}</h3></div>
      <p className="preview-goal"><strong>Mục tiêu:</strong> {draft.goal}</p>
      {practiceAi && <div className="workspace-ai-card" data-testid="practice-ai-suggestion">
        <div className="workspace-ai-head"><strong>✦ Gợi ý tổ chức từ Lumi</strong><span className="soft-tag">{practiceAi.source}</span></div>
        <p>{practiceAi.message}</p>
        {practiceAi.followUp && <p className="workspace-ai-followup">{practiceAi.followUp}</p>}
        <div className="workspace-ai-foot">
          {practiceAi.citations.length > 0 && <small>Nguồn RAG: {practiceAi.citations.join(', ')}</small>}
          <button type="button" className="text-button" onClick={() => setDraft(d => ({ ...d, notes: (d.notes ? d.notes + '\n' : '') + practiceAi.message + (practiceAi.followUp ? ' ' + practiceAi.followUp : '') }))}>+ Chèn vào ghi chú</button>
        </div>
      </div>}
      <ol className="activity-steps"><li><strong>Dự đoán</strong><p>{selectedLesson.lead}</p></li><li><strong>Thực hiện</strong><p>Đọc học liệu, xác định các đại lượng và điều kiện. Nếu có lab, thay một yếu tố và ghi hai kết quả để so sánh.</p></li><li><strong>Giải thích</strong><p>Dùng số liệu hoặc kiến thức bài học để đối chiếu dự đoán.</p></li><li><strong>Vận dụng</strong><p>{selectedLesson.exercise.prompt}</p></li></ol>{draft.notes && <p className="preview-notes"><strong>Ghi chú:</strong> {draft.notes}</p>}</> : <div className="panel-empty"><span>▤</span><h3>Một tiết học bắt đầu từ câu hỏi</h3><p>Chọn bài, viết mục tiêu rồi tạo khung hoặc bấm ✦ Gợi ý AI để thiết kế nhanh.</p></div>}</section></div> : <div className="workspace-editor"><form className="editor-panel" onSubmit={event => { event.preventDefault(); if (!quizTitle.trim()) { setNotice('Hãy nhập tên quiz.'); return; } setQuestions(pool.slice(0, Math.min(count, pool.length))); setAnswers({}); setShowAnswers(false); setQuizAi({}); setNotice(count > pool.length ? `Có ${pool.length} câu phù hợp; đã chọn toàn bộ, không lặp câu.` : `Đã chọn ${Math.min(count, pool.length)} câu từ nội dung mẫu.`); }}><h2>Tạo bộ câu hỏi</h2><label className="field">Tên quiz<input required value={quizTitle} maxLength={120} onChange={event => setQuizTitle(event.target.value)}/></label>
      <div className="field-row">
        <label className="field">Môn học<select value={subjectId} onChange={event => { setSubjectId(event.target.value); setChapterId('all'); setQuestions([]); setShowAnswers(false); }}>{subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="field field-narrow">Số câu<input type="number" min={1} max={10} required value={count} onChange={event => setCount(Number(event.target.value))}/></label>
      </div>
      <label className="field">Chương<select value={chapterId} onChange={event => { setChapterId(event.target.value); setQuestions([]); }}>{[{ id: 'all', name: 'Tất cả chương' }, ...subject.chapters.filter(chapter => chapter.lessonIds.length)].map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <p className="content-note">{pool.length} câu phù hợp. Bộ câu hỏi lấy từ nội dung mẫu đã soạn.</p><button className="primary-button">Tạo bộ quiz</button></form><section className="preview-panel"><div className="panel-title"><h2>{questions.length ? quizTitle : 'Bản xem trước quiz'}</h2>{questions.length > 0 && <div className="button-row compact-row"><span className="soft-tag">{questions.length} câu</span><button className="secondary-button" onClick={() => downloadText('LumiLab-quiz.txt', quizText(false))}>Tải đề</button><button className="secondary-button" onClick={() => downloadText('LumiLab-dap-an.txt', quizText(true))}>Tải đáp án</button></div>}</div>{questions.length === 0 ? <div className="panel-empty"><span>?</span><h3>Câu hỏi nhỏ, hiểu biết lớn</h3><p>Chọn môn và chương để tạo quiz. Có thể làm thử, hỏi gợi ý AI hoặc tải đề riêng với đáp án.</p></div> : <><div className="quiz-list">{questions.map((q, index) => <fieldset className="quiz-question" key={q.id}><legend>{index + 1}. {q.stem}</legend><div className="quiz-options-grid">{q.options.map((option, i) => <label key={option} className={answers[q.id] === i ? 'choice selected' : 'choice'}><input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => { setAnswers({ ...answers, [q.id]: i }); setShowAnswers(false); }}/><span>{String.fromCharCode(65 + i)}.</span> {option}</label>)}</div><div className="quiz-question-actions"><button type="button" className="text-button ai-action-btn" disabled={quizAiLoading === q.id} onClick={() => requestQuizAi(q)}>{quizAiLoading === q.id ? 'Đang hỏi Lumi AI…' : '✦ Gợi ý AI'}</button></div>{quizAi[q.id] && <div className="workspace-ai-card compact" data-testid="quiz-ai-hint"><div className="workspace-ai-head"><strong>✦ Gợi ý suy luận</strong><span className="soft-tag">{quizAi[q.id].source}</span></div><p>{quizAi[q.id].message}</p>{quizAi[q.id].followUp && <p className="workspace-ai-followup">{quizAi[q.id].followUp}</p>}</div>}{showAnswers && <p className="hint-box">Đáp án {String.fromCharCode(65 + q.correctIndex)}: {q.explanation}</p>}</fieldset>)}</div><div className="button-row"><button className="primary-button" onClick={() => setShowAnswers(true)}>Xem kết quả & giải thích</button><button className="secondary-button" onClick={() => { setAnswers({}); setShowAnswers(false); setNotice('Đã làm mới phần trả lời; đề được giữ nguyên.'); }}>Làm lại</button><span className="quiz-progress">Đã trả lời {questions.filter(q => answers[q.id] !== undefined).length}/{questions.length}</span></div>{showAnswers && <p role="status">Đúng {questions.filter(q => answers[q.id] === q.correctIndex).length}/{questions.length} câu. Chưa chọn đáp án được tính là chưa đúng.</p>}</>}</section></div>}
    <p className="inline-notice" role="status">{notice}</p><p className="content-note">Khung hoạt động theo mẫu, dữ liệu lưu cục bộ trên máy; chưa đồng bộ tài khoản.</p>
  </section>;
}
