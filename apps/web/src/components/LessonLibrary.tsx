import { useEffect, useState } from 'react';
import { isLabId, type LabId } from '@lumilab/lab-engine';
import { archivedPracticeIds, practiceInfo } from '../data/practice';
import { activityByLesson, legacyPractice, lessonById, lessons, readLocal, subjects, type Lesson } from '../data/learning';

const hiddenChapters: Record<string, Set<string>> = {
  physics: new Set(['waves', 'thermal', 'nuclear']),
  chemistry: new Set(['reactions', 'organic', 'bonding', 'inorganic']),
};
const librarySubjects = subjects.map(subject => ({
  ...subject,
  chapters: subject.chapters.filter(chapter => !hiddenChapters[subject.id]?.has(chapter.id))
    .map((chapter, index) => ({ ...chapter, displayNumber: index + 1 })),
}));
const visibleChapterKeys = new Set(librarySubjects.flatMap(subject =>
  subject.chapters.map(chapter => `${subject.id}:${chapter.id}`)));

export function Exercise({ lesson }: { lesson: Lesson }) {
  const exercise = lesson.exercise;
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hint, setHint] = useState(false);
  const [note, setNote] = useState(() => readLocal(`lumilab-note-${lesson.id}`, '', (value): value is string => typeof value === 'string'));
  const [saved, setSaved] = useState('');
  return <section className="lesson-exercise"><h2>Thử vận dụng</h2><p>{exercise.prompt}</p><label className="field">Ghi chú của bạn<textarea value={note} onChange={event => { setNote(event.target.value); setSaved(''); }} placeholder="Ghi giả thiết, công thức và các bước giải…" maxLength={5000}/></label><button className="text-button" onClick={() => { try { localStorage.setItem(`lumilab-note-${lesson.id}`, JSON.stringify(note)); setSaved('Đã lưu trên máy này.'); } catch { setSaved('Không lưu được. Hãy sao chép ghi chú trước khi rời trang.'); } }}>Lưu ghi chú</button><span className="inline-notice" role="status">{saved}</span>
    <form className="answer-form" onSubmit={event => { event.preventDefault(); const value = Number(answer.trim().replace(',', '.')); setFeedback(!answer.trim() || !Number.isFinite(value) ? 'Nhập một số hợp lệ và dùng đơn vị ghi bên cạnh.' : Math.abs(value - exercise.answer) <= exercise.tolerance ? 'Đúng rồi! Hãy giải thích vì sao em chọn công thức này.' : 'Chưa khớp. Kiểm tra lại đơn vị và công thức, hoặc mở gợi ý.'); }}><label className="field">Đáp án ({exercise.unit})<input inputMode="decimal" value={answer} onChange={event => { setAnswer(event.target.value); setFeedback(''); }} placeholder="Nhập đáp án" maxLength={40}/></label><button className="primary-button">Kiểm tra</button><button type="button" className="secondary-button" onClick={() => setHint(value => !value)} aria-expanded={hint}>Gợi ý & lời giải</button></form><p role="status" className="inline-notice">{feedback}</p>{hint && <div className="hint-box"><strong>Gợi ý</strong><p>{exercise.hint}</p><strong>Đáp án</strong><p>{exercise.answer.toLocaleString('vi-VN', { maximumFractionDigits: 20 })} {exercise.unit}</p><strong>Lời giải</strong><p>{exercise.explanation}</p></div>}
  </section>;
}

function GuidedActivity({ activity }: { activity: NonNullable<Lesson['activity']> }) {
  return <details className="lesson-exercise">
    <summary>Thực hành có hướng dẫn</summary>
    <ol className="activity-steps">
      <li><strong>Dự đoán</strong><p>{activity.prediction}</p></li>
      <li><strong>So sánh hai điều kiện</strong><p>{activity.compare}</p></li>
      <li><strong>Giải thích</strong><p>{activity.reflection}</p></li>
    </ol>
    <h3>Tiêu chí tự đánh giá</h3>
    <ul>{activity.rubric.map(item => <li key={item}>{item}</li>)}</ul>
  </details>;
}

function SourceActivity({ id }: { id: string }) {
  const activity = activityByLesson.get(id);
  if (!activity) return null;
  return <details className="lesson-exercise">
    <summary>Kịch bản thực hành gốc · {activity.title}</summary>
    <p>{legacyPractice.objective}</p>
    <ol>{activity.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p>{activity.assumptions}</p>
    <h3>Tự kiểm tra</h3>
    {activity.questions.map(question => <fieldset className="quiz-question" key={question.id}>
      <legend>{question.stem}</legend>
      {question.options.map(option => <label className="choice" key={option}><input type="radio" name={question.id}/>{option}</label>)}
      <details><summary>Xem đáp án</summary><p>{question.options[question.correctIndex]}</p></details>
    </fieldset>)}
    <h3>Tiêu chí gợi ý (10 điểm)</h3>
    <ul>{legacyPractice.rubric.map(item => <li key={item}>{item}</li>)}</ul>
    <p className="content-note">{legacyPractice.guidance}</p>
  </details>;
}

export function LessonLibrary({ openLab, requested }: { openLab: (id: LabId, task?: string) => void; requested: { id: string; sequence: number } | null }) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (!requested) return;
    const item = lessons.find(lesson => lesson.id === requested.id);
    if (item) { setSubjectId(item.subjectId); setChapterId(item.chapterId); setLessonId(item.id); setQuery(''); }
  }, [requested]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const subject = librarySubjects.find(item => item.id === subjectId);
  const chapter = subject?.chapters.find(item => item.id === chapterId)
    ?? subjects.find(item => item.id === subjectId)?.chapters.find(item => item.id === chapterId);
  const lesson = lessonId ? lessonById(lessonId) : undefined;
  const normalize = (text: string) => text.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
  const search = normalize(query.trim());
  const lessonMatches = search ? lessons.filter(item => visibleChapterKeys.has(`${item.subjectId}:${item.chapterId}`)
    && normalize(`${item.title} ${item.lead} ${item.formulas.map(f => f.expression).join(' ')}`).includes(search)) : [];
  const chapterMatches = search ? librarySubjects.flatMap(item => item.chapters.flatMap(ch => {
    return normalize(`${ch.name} ${ch.description}`).includes(search) ? [{ subjectId: item.id, chapter: ch }] : [];
  })) : [];
  return <section className="learning-page"><div className="workspace-heading"><div><p className="breadcrumb">Một hành trình từ kiến thức đến thực hành</p><h1>Thư viện bài học</h1><p>Đọc, dự đoán, thử nghiệm rồi vận dụng.</p></div><span className="soft-tag">{librarySubjects.length} môn · {librarySubjects.reduce((count, item) => count + item.chapters.length, 0)} chương mẫu</span></div>
    <label className="library-search"><span>Tìm bài học</span><input type="search" value={query} placeholder="Tên bài, công thức hoặc chủ đề…" onChange={event => setQuery(event.target.value)} aria-label="Tìm bài học"/></label>
    {search && <section className="search-results" aria-label="Kết quả tìm kiếm"><h2>Kết quả tìm kiếm</h2>
      {lessonMatches.map(item => <button className="search-result" key={item.id} onClick={() => { setSubjectId(item.subjectId); setChapterId(item.chapterId); setLessonId(item.id); setQuery(''); }}><strong>{item.title}</strong><span>{item.subjectId === 'physics' ? 'Vật lí' : 'Hóa học'} · Kiến thức & bài tập</span></button>)}
      {chapterMatches.map(({ subjectId: subjectKey, chapter: item }) => <button className="search-result" key={item.id} onClick={() => { setSubjectId(subjectKey); setChapterId(item.id); setLessonId(null); setQuery(''); }}><strong>{item.name}</strong><span>Chương {item.displayNumber}</span></button>)}
      {!lessonMatches.length && !chapterMatches.length && <p>Chưa có bài phù hợp. Thử “con lắc”, “chuẩn độ” hoặc “mạch điện”.</p>}
    </section>}
    <nav className="breadcrumbs" aria-label="Đường dẫn bài học"><button onClick={() => { setSubjectId(null); setChapterId(null); setLessonId(null); }}>Tất cả môn</button>{subject && <><span>/</span><button onClick={() => { setChapterId(null); setLessonId(null); }}>{subject.name}</button></>}{chapter && <><span>/</span><button onClick={() => setLessonId(null)}>{chapter.name}</button></>}</nav>
    {!subject ? <div className="subject-grid">{librarySubjects.map(item => <button key={item.id} className={`subject-card ${item.id}`} onClick={() => setSubjectId(item.id)}><span className="subject-symbol">{item.symbol}</span><span className="soft-tag">{item.chapters.length} chương</span><h2>{item.name}</h2><p>{item.description}</p><span className="subject-cta">Khám phá môn học →</span></button>)}</div> : !chapter ? <><h2 className="section-heading">Các chương {subject.name}</h2><div className="chapter-grid">{subject.chapters.map(item => <article className="chapter-card" key={item.id}><span className="chapter-index">Chương {item.displayNumber}</span><h2>{item.name}</h2><p>{item.description}</p><button className="secondary-button" onClick={() => setChapterId(item.id)}>Xem chương</button></article>)}</div></> : !lesson ? <>
      {!chapter.lessonIds.length && <p className="content-note">Chương này chưa có bài học trong thư viện.</p>}
      <div className="lesson-list">{chapter.lessonIds.map(id => { const item = lessonById(id); return <article className="chapter-card" key={id}><span className="soft-tag">Kiến thức · Công thức · Bài tập</span><h2>{item.title}</h2><p>{item.lead}</p><button className="primary-button" onClick={() => setLessonId(id)}>Xem bài học</button></article>; })}</div></> : <article className="lesson-detail"><div className="lesson-title"><h2>{lesson.title}</h2><p>{lesson.lead}</p>{isLabId(lesson.id) ? <button className="primary-button" onClick={() => openLab(lesson.id as LabId)}>{archivedPracticeIds.includes(lesson.id) ? 'Mở mô phỏng lưu trữ' : practiceInfo[lesson.id].label}</button> : <span className="soft-tag">Lab tương ứng đang phát triển trên React</span>}</div><div className="lesson-path"><span>① Lý thuyết</span><span>② Công thức</span><span>③ Bài tập</span><span>④ Lab tương ứng</span></div><div className="lesson-columns"><section><h2>Kiến thức nền</h2>{lesson.knowledge.map(item => <div className="knowledge-block" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}</section><aside><h2>Công thức cần nhớ</h2>{lesson.formulas.map(item => <div className="formula-card" key={item.expression}><strong>{item.expression}</strong><p>{item.description}</p></div>)}</aside></div><Exercise key={lesson.id} lesson={lesson}/>{isLabId(lesson.id) && <button className="secondary-button" onClick={() => openLab(lesson.id as LabId, lesson.exercise.id)}>Làm bài này trong thí nghiệm</button>}{lesson.activity && <GuidedActivity key={`guided-${lesson.id}`} activity={lesson.activity}/>}<SourceActivity key={`activity-${lesson.id}`} id={lesson.id}/>{isLabId(lesson.id) && <section className="lesson-lab-link"><div><h2>Kiểm chứng bằng thực hành</h2><p>Thử đổi một yếu tố, ghi số đo và đối chiếu với kiến thức vừa học.</p></div><button className="primary-button" onClick={() => openLab(lesson.id as LabId)}>{archivedPracticeIds.includes(lesson.id) ? 'Thực hành với mô phỏng lưu trữ' : 'Thực hành ngay'}</button></section>}</article>}
    <p className="content-note">Nội dung mẫu đang biên soạn; thứ tự chương chưa được đối chiếu một bộ SGK cụ thể.</p>
  </section>;
}
