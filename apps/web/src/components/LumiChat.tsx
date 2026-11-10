import { useEffect, useRef, useState } from 'react';
import { lessons, downloadText } from '../data/learning';
import type { LabId } from '@lumilab/lab-engine';
import { useEngines, useLab } from '../labSession';
import { LumiSavedRuns } from './LumiSavedRuns';
import { askServerTutor, getServerRun } from '../serverRuns';
import { apiBase, isPreview } from '../api';
import { retrieveLearning, type RetrievalResponse } from '../retrieval';
import { labContext } from '../data/labContext';
import { routeLumiQuestion } from '../data/lumiRouting';

interface Message { role: 'user' | 'assistant'; text: string; source?: string; retrieval?: RetrievalResponse; tutorSource?: string; notice?: string; runPreview?: string }
export function LumiChat({ active, labId, openLab }: { active: boolean; labId: LabId; openLab: () => void }) {
  const engines = useEngines();
  useLab(labId);
  const context = labContext(engines, labId);
  const [serverTutor, setServerTutor] = useState(false);
  const [liveTutorEnabled, setLiveTutorEnabled] = useState<boolean | null | undefined>();
  const [retrieve, setRetrieve] = useState(false);
  const [retrievalMethod, setRetrievalMethod] = useState<'lexical' | 'vector' | 'hybrid'>('lexical');
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [learningLevel, setLearningLevel] = useState<'THCS' | 'THPT'>('THPT');
  const [attach, setAttach] = useState(false);
  const [mode, setMode] = useState<'qa' | 'hint' | 'explain' | 'feedback'>('qa');
  const [level, setLevel] = useState(1);
  useEffect(() => { setLessonId(lessons.some(item => item.id === labId) ? labId : 'pendulum'); lastRouted.current = ''; setLevel(1); }, [labId]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedRun, setSavedRun] = useState({ lessonId: '', id: '' });
  const [waiting, setWaiting] = useState(false);
  const pendingRun = useRef<AbortController | null>(null);
  const lastRouted = useRef('');
  const [input, setInput] = useState('');
  const [lessonId, setLessonId] = useState('pendulum');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (messages.length) end.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }, [messages]);
  useEffect(() => () => {
    pendingRun.current?.abort();
    pendingRun.current = null;
  }, []);
  useEffect(() => {
    if (!serverTutor) return;
    const controller = new AbortController();
    setLiveTutorEnabled(undefined);
    fetch(apiBase + '/api/v1/tutor/status', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Tutor status unavailable'); return response.json(); })
      .then((status: { live_enabled: boolean }) => setLiveTutorEnabled(status.live_enabled))
      .catch(() => { if (!controller.signal.aborted) setLiveTutorEnabled(null); });
    return () => controller.abort();
  }, [serverTutor]);

  async function send(question: string) {
    const text = question.trim().slice(0, 800);
    if (!text || pendingRun.current) return;
    const refersToRun = /lượt|số đo|kết quả|dữ liệu/.test(text.toLocaleLowerCase('vi'));
    const runLessonId = attach && refersToRun ? savedRun.lessonId || labId : '';
    const activeLessonId = routeLumiQuestion(text, runLessonId || lastRouted.current || (attach ? labId : ''));
    if (activeLessonId) setLessonId(activeLessonId);
    lastRouted.current = activeLessonId;
    if (!activeLessonId && !(serverTutor && mode === 'qa')) {
      setMessages(previous => [...previous.slice(-38), { role: 'user', text }, { role: 'assistant', text: 'Chưa tìm thấy học liệu hoặc chủ đề lab phù hợp. Bạn hãy thêm tên hiện tượng, chất hoặc bài lab để Lumi hiểu đúng câu hỏi.' }]);
      setInput('');
      return;
    }
    if (serverTutor) {
      const controller = new AbortController(); pendingRun.current = controller; setWaiting(true); setInput('');
      let answer: Message;
      try {
        const result = await askServerTutor({ lab_id: activeLessonId || null, question: text,
          mode: mode === 'explain' ? 'explanation' : mode, hint_level: level,
          run_id: attach && savedRun.lessonId === activeLessonId && savedRun.id ? savedRun.id : null,
          include_drafts: includeDrafts, level: learningLevel,
          history: messages.slice(-4).map(item => ({ role: item.role, text: item.text.slice(0, 1000) })),
        }, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
        const cleanMessage = result.answer.output.message.replace(/^Preview từ mô hình nháp[^.]*\.\s*/i, '');
        const cited = new Set(result.answer.output.citation_ids);
        answer = { role: 'assistant', retrieval: cited.size ? { ...result.retrieval, hits: result.retrieval.hits.filter(hit => cited.has(hit.chunk_id)) } : undefined,
          tutorSource: result.answer.response_source === 'llm' ? 'LLM · ' + result.answer.model : result.answer.response_source === 'cache' ? 'Phản hồi lưu đệm' : 'Hướng dẫn theo mẫu',
          notice: result.answer.notice && (result.answer.response_source === 'template' || cited.size) ? 'Dữ liệu chưa duyệt' : undefined,
          text: cleanMessage + (mode !== 'qa' && result.answer.output.follow_up ? '\n\n' + result.answer.output.follow_up : ''),
          runPreview: result.run ? Object.entries(result.run.preview).map(([key, value]) => key + ' = ' + String(value)).join('\n') : undefined,
        };
      } catch {
        answer = { role: 'assistant', text: 'Gia sư máy chủ chưa sẵn sàng. Em vẫn có thể dùng bài học và thí nghiệm trên máy; hãy thử lại khi API và phiên hoạt động.' };
      }
      if (pendingRun.current !== controller) return;
      pendingRun.current = null; setWaiting(false);
      setMessages(previous => [...previous.slice(-38), { role: 'user', text }, answer]); return;
    }
    if (attach && refersToRun && savedRun.id && savedRun.lessonId === activeLessonId) {
      const controller = new AbortController();
      pendingRun.current = controller;
      setWaiting(true);
      setInput('');
      let reply: string;
      let source: string | undefined;
      try {
        const run = await getServerRun(savedRun.id, AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]));
        if (run.lab_id !== activeLessonId || run.run_id !== savedRun.id ||
            run.result.status !== 'INSUFFICIENT_DATA' || run.result.code !== 'REVIEWED_EVIDENCE_REQUIRED' ||
            !isPreview(run.result.preview)) throw new Error('Invalid draft run');
        const title = lessons.find(item => item.id === run.lab_id)?.title ?? run.lab_id;
        source = title + ' · Lượt đã lưu trên máy chủ';
        reply = 'Dữ liệu chưa duyệt · Preview của lượt đã lưu\n' +
          'Thời điểm mô phỏng ' + run.input.elapsed_s + ' s\n\n' +
          Object.entries(run.result.preview).map(([key, value]) =>
            key + ' = ' + (value === null ? '—' : String(value))).join('\n') +
          '\n\nEm thử đối chiếu số liệu với thông số đã nhập. Đại lượng nào có thể giải thích kết quả này?';
      } catch {
        reply = 'Lumi không mở được lượt đã lưu trong phiên này. Hãy tải lại danh sách hoặc chọn lượt khác.';
      }
      if (pendingRun.current !== controller) return;
      pendingRun.current = null;
      setWaiting(false);
      setMessages(previous => [...previous.slice(-38), { role: 'user', text }, { role: 'assistant', text: reply, source }]);
      return;
    }
    if (retrieve) {
      const controller = new AbortController();
      pendingRun.current = controller;
      setWaiting(true);
      setInput('');
      let answer: Message;
      try {
        const retrieval = await retrieveLearning(activeLessonId, text, includeDrafts,
          AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]), retrievalMethod, learningLevel);
        answer = {
          role: 'assistant', retrieval,
          text: retrieval.hits.length ? 'Học liệu tìm được cho câu hỏi của bạn.' :
            'Chưa tìm thấy học liệu phù hợp trong phạm vi và trạng thái duyệt đã chọn.',
        };
      } catch {
        answer = { role: 'assistant', text: 'Không truy xuất được học liệu local. Hãy kiểm tra API rồi thử lại.' };
      }
      if (pendingRun.current !== controller) return;
      pendingRun.current = null;
      setWaiting(false);
      setMessages(previous => [...previous.slice(-38), { role: 'user', text }, answer]);
      return;
    }
    const lesson = lessons.find(item => item.id === activeLessonId);
    let reply = 'Mình chưa có câu trả lời phù hợp trong nội dung hiện có. Bạn có thể hỏi rõ hơn về hiện tượng, công thức hoặc bài thực hành.';
    if (lesson) {
      const normalized = text.toLocaleLowerCase('vi');
      if (/công thức|tính|formula/.test(normalized)) reply = lesson.formulas.map(item => `${item.expression}\n${item.description}`).join('\n\n') + '\n\nBạn muốn áp dụng công thức vào tình huống nào?';
      else if (/bài tập|vận dụng|luyện/.test(normalized)) reply = `${lesson.exercise.prompt}\n\nGợi ý đầu tiên: ${lesson.exercise.hint}\n\nBạn thử ghi bước đầu tiên của mình nhé.`;
      else if (/khối lượng|chu kỳ/.test(normalized) && lesson.id === 'pendulum') reply = 'Trong mô hình con lắc lý tưởng, khối lượng không làm đổi chu kỳ. Hãy giữ chiều dài và góc thả, ghi hai lần đo với hai khối lượng khác nhau. Sau đó so sánh T.\n\nNếu góc thả lớn, cần tính ảnh hưởng của biên độ; công thức góc nhỏ là một xấp xỉ.';
      else reply = `${lesson.knowledge.slice(0, 2).map(item => `${item.title}\n${item.text}`).join('\n\n')}\n\nBạn đang vướng ở khái niệm, công thức hay cách làm bài?`;
    }
    if (lesson && attach && activeLessonId === labId) {
      if (mode === 'hint') reply = level === 1 ? 'Em muốn kiểm tra ảnh hưởng của yếu tố nào? Hãy nêu một dự đoán trước khi đổi thông số.' : level === 2 ? 'Thử chỉ thay đổi một yếu tố, giữ các yếu tố còn lại. Ghi lại hai lượt để đối chiếu; nếu đổi nhiều yếu tố, chưa thể biết nguyên nhân.' : `${context.guidance}\n\nSố đo hiện tại:\n${context.facts}`;
      else if (mode === 'explain' || /số đo|lượt thử|đang chạy|thí nghiệm hiện tại/.test(text.toLocaleLowerCase('vi'))) reply = `Lượt thử hiện tại:\n${context.facts}\n\n${context.guidance}\n\nEm thay đổi đại lượng nào giữa hai lần đo?`;
      else if (mode === 'feedback') reply = `Dự đoán đã ghi: ${context.prediction || 'chưa có'}.\nKết luận đã ghi: ${context.reflection || 'chưa có'}.\nĐã ghi ${context.records} lượt.\n\n${context.records < 2 ? 'Hãy ghi ít nhất hai lượt có điều kiện khác nhau để đối chiếu.' : 'Đã có nhiều lượt; hãy chỉ ra thông số được thay đổi và số liệu hỗ trợ kết luận.'} Nhận xét này theo mẫu, chưa chấm mức hiểu của em từ văn bản tự do.\n\n${context.facts}`;
    }
    setMessages(previous => [...previous.slice(-38), { role: 'user', text }, { role: 'assistant', text: reply, source: lesson ? `${lesson.title}${attach && activeLessonId === labId ? ' · Số đo từ lượt thử' : ''}` : undefined }]);
    setInput('');
  }
  return <section className="lumi-page"><div className="workspace-heading"><div><p className="breadcrumb">Một nơi để đặt câu hỏi</p><h1>Cùng Lumi khám phá</h1><p>Đặt câu hỏi trực tiếp; Lumi tự tìm bài phù hợp trong nội dung hiện có.</p></div><div className="button-row"><button className="secondary-button" disabled={!messages.length} onClick={() => downloadText('LumiLab-hoi-dap.txt', messages.map(m => `${m.role === 'user' ? 'Bạn' : 'Lumi'}: ${m.text}${m.source ? '\nNguồn: ' + m.source : ''}`).join('\n\n'))}>Tải hội thoại</button><button className="secondary-button" disabled={waiting} onClick={() => { setMessages([]); lastRouted.current = ''; setLevel(1); }}>Cuộc trò chuyện mới</button></div></div><div className="lumi-layout sources-collapsed">

    <section className="chat-panel" aria-label="Chat với Lumi"><div className="chat-topbar"><div><span className="soft-tag">✦ Lumi</span></div><span className="chat-disclosure">{serverTutor ? liveTutorEnabled === true ? 'Gia sư máy chủ · AI bật khi đủ điều kiện' : liveTutorEnabled === false ? 'Gia sư máy chủ · AI tắt, dùng mẫu' : liveTutorEnabled === null ? 'Gia sư máy chủ · Không rõ trạng thái AI' : 'Gia sư máy chủ · Đang kiểm tra AI' : retrieve ? 'Tra cứu học liệu có nguồn · RAG' : 'Theo kịch bản · Chưa kết nối AI'}</span></div>
    <div className="lumi-tools">
      <label className="snapshot-toggle"><input type="checkbox" checked={attach} onChange={event => setAttach(event.target.checked)}/>Dùng lượt thử hiện tại</label>
      <label><input type="checkbox" checked={serverTutor} disabled={waiting} onChange={event => { setServerTutor(event.target.checked); if (event.target.checked) setRetrieve(false); }}/>Hỏi gia sư máy chủ</label>
      <label><input type="checkbox" checked={retrieve} disabled={waiting} onChange={event => { setRetrieve(event.target.checked); if (event.target.checked) setServerTutor(false); }}/>Tra cứu học liệu có nguồn</label>
      {(retrieve || serverTutor) && <label className="inline-select">Bậc học<select aria-label="Bậc học" value={learningLevel} disabled={waiting} onChange={e => setLearningLevel(e.target.value as 'THCS' | 'THPT')}><option value="THPT">THPT</option><option value="THCS">THCS · học liệu nền</option></select></label>}
      {(retrieve || serverTutor) && <label><input type="checkbox" checked={includeDrafts} disabled={waiting} onChange={event => setIncludeDrafts(event.target.checked)}/>Cho phép học liệu chưa duyệt</label>}
      {retrieve && <label className="inline-select">Cách truy xuất<select aria-label="Cách truy xuất" value={retrievalMethod} disabled={waiting} onChange={e => setRetrievalMethod(e.target.value as 'lexical' | 'vector' | 'hybrid')}><option value="lexical">Từ khóa local</option><option value="vector">Vector local</option><option value="hybrid">Kết hợp BM25 + vector</option></select></label>}
      <div className="lumi-mode-group">
        <select aria-label="Chế độ Lumi" value={mode} onChange={event => { setMode(event.target.value as typeof mode); setLevel(1); }}><option value="qa">Hỏi đáp bài học</option><option value="hint">Gợi ý từng bước</option><option value="explain">Giải thích số đo</option><option value="feedback">Đối chiếu dự đoán</option></select>
        {mode === 'hint' && <button className="text-button" disabled={level === 3} onClick={() => { setLevel(previous => Math.min(3, previous + 1)); }}>Tăng mức gợi ý ({level}/3)</button>}
      </div>
    </div>
    {attach && <div className="lumi-context-strip">
      {active && <LumiSavedRuns key={lessonId} lessonId={lessonId} selected={savedRun.lessonId === lessonId ? savedRun.id : ''} onSelect={id => setSavedRun({ lessonId, id })} disabled={waiting}/>}
      {attach && !(savedRun.id && savedRun.lessonId === lessonId) && <details className="lumi-snapshot"><summary>Đang dùng: {lessons.find(item => item.id === labId)?.title} · {context.records} số đo</summary><p data-testid="lumi-lab-facts">{context.facts}</p><div>{context.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}<button className="text-button" onClick={openLab}>Trở lại thí nghiệm</button></div><p className="content-note">Số liệu tính tại máy; nguồn mô hình đang chờ duyệt học thuật.</p></details>}
    </div>}
    <div className="chat-messages" aria-live="polite">{messages.length === 0 ? <div className="lumi-welcome"><span className="lumi-orb">✦</span><h2>Hôm nay bạn tò mò điều gì?</h2><p>Bắt đầu bằng một câu hỏi, một công thức hoặc điều chưa rõ trong bài học.</p><div className="suggestion-grid">{['Vì sao khối lượng không đổi chu kỳ con lắc?', 'Định luật Ôm dùng thế nào?', 'Cho mình một bài tập về lò xo'].map(text => <button key={text} onClick={() => send(text)}>{text} ↗</button>)}</div></div> : messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>
      <div className="message-header">
        <span className="message-author">{message.role === 'user' ? 'Bạn' : '✦ Lumi'}</span>
        {message.tutorSource && <span className="message-source">{message.tutorSource}</span>}
        {!message.tutorSource && message.source && <span className="message-source">Học liệu: {message.source}</span>}
      </div>
      <p className="message-body">{message.text}</p>
      {message.notice && <small className="message-notice">{message.notice}</small>}
      {message.runPreview && <details className="lumi-answer-detail"><summary>Preview lượt đã lưu · dữ liệu chưa duyệt</summary><pre>{message.runPreview}</pre></details>}
      {message.retrieval && <details className="retrieval-box" aria-label="Học liệu truy xuất">
        <summary>Học liệu tham khảo ({message.retrieval.hits.length})</summary>
        <div className="retrieval-header">
          <span className="retrieval-badge">Học liệu tham chiếu ({message.retrieval.hits.length})</span>
          <small>Kho {message.retrieval.corpus_revision} · {message.retrieval.retrieval_method === 'local-lexical' ? 'Truy xuất từ khóa local' : message.retrieval.retrieval_method.startsWith('local-hybrid') ? 'Truy xuất kết hợp BM25 + vector' : message.retrieval.retrieval_method === 'local-hash-vector' ? 'Vector băm từ khóa local' : 'Vector ngữ nghĩa local'}</small>
        </div>
        <div className="retrieval-cards">
          {message.retrieval.hits.map(hit => <article className="retrieval-card" key={hit.chunk_id}>
            <div className="retrieval-card-head">
              <strong>{hit.document.title}</strong>
              <span className={`retrieval-status status-${hit.document.review_status}`}>{hit.document.review_status === 'draft' ? 'Dữ liệu chưa duyệt' : hit.document.review_status === 'cross_checked' ? 'Đã đối chiếu · chờ giáo viên duyệt' : 'Đã duyệt học liệu bởi ' + hit.document.reviewer + ' · ' + hit.document.reviewed_at}</span>
            </div>
            <p className="retrieval-card-text">{hit.document.text}</p>
            <div className="retrieval-card-meta">
              {hit.document.provenance && <small>{hit.document.provenance.book} · {hit.document.provenance.chapter} / {hit.document.provenance.section} · {hit.document.provenance.license}</small>}
              <small className="chunk-id">Mã đoạn {hit.chunk_id}</small>
            </div>
            <details className="retrieval-details">
              <summary>Điều kiện, phạm vi & nguồn tham khảo ({hit.document.references.length})</summary>
              <ul>{hit.document.assumptions.map(value => <li key={value}>{value}</li>)}</ul>
              <p>Nguồn tham khảo</p>
              <ul>{hit.document.references.map(reference => <li key={reference.url}>
                <a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a>
              </li>)}</ul>
            </details>
          </article>)}
        </div>
      </details>}
    </div>)}<div ref={end}/></div><form className="chat-composer" onSubmit={event => { event.preventDefault(); send(input); }}><div className="composer-top"><span className="composer-hint">{serverTutor ? 'Lumi tự tìm chủ đề phù hợp · Enter để gửi' : 'Enter để gửi · Shift+Enter xuống dòng'}</span></div><div className="chat-input-row"><label className="sr-only" htmlFor="lumi-question">Hỏi Lumi</label><textarea id="lumi-question" rows={2} placeholder="Hỏi Lumi về bài học, công thức hoặc số đo thí nghiệm…" value={input} maxLength={800} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }}/><button className="primary-button" aria-label="Gửi câu hỏi" disabled={waiting || !input.trim()}>{waiting ? '…' : '↑'}</button></div></form></section>
  </div></section>;
}
