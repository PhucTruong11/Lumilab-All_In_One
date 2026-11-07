import { useEffect, useRef, useState } from 'react';
import { lessons, subjects, downloadText } from '../data/learning';
import type { LabId } from '@lumilab/lab-engine';
import { useEngines, useLab } from '../labSession';
import { LumiSavedRuns } from './LumiSavedRuns';
import { askServerTutor, getServerRun } from '../serverRuns';
import { isPreview } from '../api';
import { retrieveLearning, type RetrievalResponse } from '../retrieval';
import { labContext } from '../data/labContext';

interface Message { role: 'user' | 'assistant'; text: string; source?: string; retrieval?: RetrievalResponse; tutorSource?: string }
export function LumiChat({ active, labId, openLab }: { active: boolean; labId: LabId; openLab: () => void }) {
  const engines = useEngines();
  useLab(labId);
  const context = labContext(engines, labId);
  const [serverTutor, setServerTutor] = useState(false);
  const [retrieve, setRetrieve] = useState(false);
  const [retrievalMethod, setRetrievalMethod] = useState<'lexical' | 'vector' | 'hybrid'>('lexical');
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [learningLevel, setLearningLevel] = useState<'THCS' | 'THPT'>('THPT');
  const [attach, setAttach] = useState(true);
  const [mode, setMode] = useState<'qa' | 'hint' | 'explain' | 'feedback'>('qa');
  const [level, setLevel] = useState(1);
  useEffect(() => { setLessonId(lessons.some(item => item.id === labId) ? labId : 'pendulum'); setLevel(1); }, [labId]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedRun, setSavedRun] = useState({ lessonId: '', id: '' });
  const [waiting, setWaiting] = useState(false);
  const pendingRun = useRef<AbortController | null>(null);
  const [input, setInput] = useState('');
  const [sources, setSources] = useState(lessons.map(lesson => lesson.id));
  const [lessonId, setLessonId] = useState('pendulum');
  const [panel, setPanel] = useState(true);
  const [sourceTab, setSourceTab] = useState<'sources' | 'tree'>('sources');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (messages.length) end.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }, [messages]);
  useEffect(() => () => {
    pendingRun.current?.abort();
    pendingRun.current = null;
  }, []);

  async function send(question: string) {
    const text = question.trim().slice(0, 800);
    if (!text || pendingRun.current) return;
    if (serverTutor) {
      if (!sources.includes(lessonId)) {
        setMessages(previous => [...previous.slice(-38), { role: 'user', text }, { role: 'assistant', text: 'Bài đang hỏi chưa chọn nguồn. Hãy chọn nguồn của bài trước.' }]);
        setInput(''); return;
      }
      const controller = new AbortController(); pendingRun.current = controller; setWaiting(true); setInput('');
      let answer: Message;
      try {
        const result = await askServerTutor({ lab_id: lessonId, question: text,
          mode: mode === 'explain' ? 'explanation' : mode, hint_level: level,
          run_id: savedRun.lessonId === lessonId && savedRun.id ? savedRun.id : null,
          include_drafts: includeDrafts, level: learningLevel,
          history: messages.slice(-4).map(item => ({ role: item.role, text: item.text.slice(0, 1000) })),
        }, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
        answer = { role: 'assistant', retrieval: result.retrieval,
          tutorSource: result.answer.response_source === 'llm' ? 'LLM · ' + result.answer.model : result.answer.response_source === 'cache' ? 'Phản hồi lưu đệm' : 'Hướng dẫn theo mẫu',
          text: result.answer.notice + '\n\n' + result.answer.output.message +
            (result.answer.output.follow_up ? '\n\n' + result.answer.output.follow_up : '') +
            (result.run ? '\n\nPreview lượt đã lưu · dữ liệu chưa duyệt\n' + Object.entries(result.run.preview).map(([key, value]) => key + ' = ' + String(value)).join('\n') : ''),
        };
      } catch {
        answer = { role: 'assistant', text: 'Gia sư máy chủ chưa sẵn sàng. Em vẫn có thể dùng bài học và thí nghiệm trên máy; hãy thử lại khi API và phiên hoạt động.' };
      }
      if (pendingRun.current !== controller) return;
      pendingRun.current = null; setWaiting(false);
      setMessages(previous => [...previous.slice(-38), { role: 'user', text }, answer]); return;
    }
    if (savedRun.id && savedRun.lessonId === lessonId) {
      const controller = new AbortController();
      pendingRun.current = controller;
      setWaiting(true);
      setInput('');
      let reply: string;
      let source: string | undefined;
      try {
        const run = await getServerRun(savedRun.id, AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]));
        if (run.lab_id !== lessonId || run.run_id !== savedRun.id ||
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
      if (!sources.includes(lessonId)) {
        setMessages(previous => [...previous.slice(-38), { role: 'user', text },
          { role: 'assistant', text: 'Bài đang hỏi chưa chọn nguồn. Hãy chọn bài trong Nguồn học tập.' }]);
        setInput('');
        return;
      }
      const controller = new AbortController();
      pendingRun.current = controller;
      setWaiting(true);
      setInput('');
      let answer: Message;
      try {
        const retrieval = await retrieveLearning(lessonId, text, includeDrafts,
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
    const lesson = lessons.find(item => item.id === lessonId && sources.includes(item.id));
    let reply = sources.length ? 'Bài đang hỏi chưa có trong nguồn được chọn. Hãy chọn nguồn tương ứng hoặc đổi bài đang hỏi.' : 'Bạn chưa chọn nguồn nào. Mở Nguồn học tập và chọn một bài để Lumi dùng nội dung mẫu.';
    if (lesson) {
      const normalized = text.toLocaleLowerCase('vi');
      if (/công thức|tính|formula/.test(normalized)) reply = lesson.formulas.map(item => `${item.expression}\n${item.description}`).join('\n\n') + '\n\nBạn muốn áp dụng công thức vào tình huống nào?';
      else if (/bài tập|vận dụng|luyện/.test(normalized)) reply = `${lesson.exercise.prompt}\n\nGợi ý đầu tiên: ${lesson.exercise.hint}\n\nBạn thử ghi bước đầu tiên của mình nhé.`;
      else if (/khối lượng|chu kỳ/.test(normalized) && lesson.id === 'pendulum') reply = 'Trong mô hình con lắc lý tưởng, khối lượng không làm đổi chu kỳ. Hãy giữ chiều dài và góc thả, ghi hai lần đo với hai khối lượng khác nhau. Sau đó so sánh T.\n\nNếu góc thả lớn, cần tính ảnh hưởng của biên độ; công thức góc nhỏ là một xấp xỉ.';
      else reply = `${lesson.knowledge.slice(0, 2).map(item => `${item.title}\n${item.text}`).join('\n\n')}\n\nBạn đang vướng ở khái niệm, công thức hay cách làm bài?`;
    }
    if (lesson && attach && lessonId === labId) {
      if (mode === 'hint') reply = level === 1 ? 'Em muốn kiểm tra ảnh hưởng của yếu tố nào? Hãy nêu một dự đoán trước khi đổi thông số.' : level === 2 ? 'Thử chỉ thay đổi một yếu tố, giữ các yếu tố còn lại. Ghi lại hai lượt để đối chiếu; nếu đổi nhiều yếu tố, chưa thể biết nguyên nhân.' : `${context.guidance}\n\nSố đo hiện tại:\n${context.facts}`;
      else if (mode === 'explain' || /số đo|lượt thử|đang chạy|thí nghiệm hiện tại/.test(text.toLocaleLowerCase('vi'))) reply = `Lượt thử hiện tại:\n${context.facts}\n\n${context.guidance}\n\nEm thay đổi đại lượng nào giữa hai lần đo?`;
      else if (mode === 'feedback') reply = `Dự đoán đã ghi: ${context.prediction || 'chưa có'}.\nKết luận đã ghi: ${context.reflection || 'chưa có'}.\nĐã ghi ${context.records} lượt.\n\n${context.records < 2 ? 'Hãy ghi ít nhất hai lượt có điều kiện khác nhau để đối chiếu.' : 'Đã có nhiều lượt; hãy chỉ ra thông số được thay đổi và số liệu hỗ trợ kết luận.'} Nhận xét này theo mẫu, chưa chấm mức hiểu của em từ văn bản tự do.\n\n${context.facts}`;
    }
    setMessages(previous => [...previous.slice(-38), { role: 'user', text }, { role: 'assistant', text: reply, source: lesson ? `${lesson.title}${attach && lessonId === labId ? ' · Số đo từ lượt thử' : ''}` : undefined }]);
    setInput('');
  }
  return <section className="lumi-page"><div className="workspace-heading"><div><p className="breadcrumb">Một nơi để đặt câu hỏi</p><h1>Cùng Lumi khám phá</h1><p>Kết nối bài học, câu hỏi và điều bạn vừa quan sát.</p></div><div className="button-row"><button className="secondary-button" disabled={!messages.length} onClick={() => downloadText('LumiLab-hoi-dap.txt', messages.map(m => `${m.role === 'user' ? 'Bạn' : 'Lumi'}: ${m.text}${m.source ? '\nNguồn: ' + m.source : ''}`).join('\n\n'))}>Tải hội thoại</button><button className="secondary-button" disabled={waiting} onClick={() => { setMessages([]); setLevel(1); }}>Cuộc trò chuyện mới</button></div></div><div className={`lumi-layout ${panel ? '' : 'sources-collapsed'}`}>
    {panel && <aside className="sources-panel"><div className="panel-title"><h2>Nguồn học tập</h2><button className="text-button" onClick={() => setPanel(false)} aria-label="Thu gọn nguồn học tập">← Thu gọn</button></div><div className="segmented small"><button aria-pressed={sourceTab === 'sources'} onClick={() => setSourceTab('sources')}>Nguồn</button><button aria-pressed={sourceTab === 'tree'} onClick={() => setSourceTab('tree')}>Cây kiến thức</button></div>{sourceTab === 'sources' ? <><p className="content-note">Chọn những bài bạn muốn dùng khi hỏi Lumi.</p>{lessons.map(item => <label className="source-row" key={item.id}><input type="checkbox" checked={sources.includes(item.id)} onChange={event => setSources(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id))}/><span><strong>{item.title}</strong><small>{item.subjectId === 'physics' ? 'Vật lí' : 'Hóa học'} · Học liệu mẫu</small></span></label>)}</> : <div className="knowledge-tree">{subjects.map(subject => <details key={subject.id} open><summary>{subject.symbol} {subject.name}</summary>{subject.chapters.map(chapter => <details key={chapter.id}><summary>{chapter.name}</summary>{chapter.lessonIds.map(id => <button key={id} onClick={() => { setLessonId(id); setSources(previous => previous.includes(id) ? previous : [...previous, id]); }}>{lessons.find(item => item.id === id)?.title}</button>)}</details>)}</details>)}<p className="content-note">Lộ trình mẫu: đọc kiến thức → dự đoán → thực hành khi có lab → làm bài vận dụng.</p></div>}</aside>}
    <section className="chat-panel" aria-label="Chat với Lumi"><div className="chat-topbar"><div>{!panel && <button className="secondary-button" onClick={() => setPanel(true)}>Hiện nguồn học tập</button>}<span className="soft-tag">✦ Lumi</span></div><span className="chat-disclosure">Theo kịch bản · Chưa kết nối AI</span></div><div className="lumi-tools"><label className="snapshot-toggle"><input type="checkbox" checked={attach} onChange={event => setAttach(event.target.checked)}/>Dùng lượt thử hiện tại</label><select aria-label="Chế độ Lumi" value={mode} onChange={event => { setMode(event.target.value as typeof mode); setLevel(1); }}><option value="qa">Hỏi đáp bài học</option><option value="hint">Gợi ý từng bước</option><option value="explain">Giải thích số đo</option><option value="feedback">Đối chiếu dự đoán</option></select>{mode === 'hint' && <button className="text-button" disabled={level === 3} onClick={() => { setLevel(previous => Math.min(3, previous + 1)); }}>Tăng mức gợi ý ({level}/3)</button>}</div>
    <div className="lumi-tools">
      <label><input type="checkbox" checked={serverTutor} disabled={waiting} onChange={event => setServerTutor(event.target.checked)}/>Hỏi gia sư máy chủ</label>
      <label><input type="checkbox" checked={retrieve} disabled={waiting} onChange={event => setRetrieve(event.target.checked)}/>Tra cứu học liệu có nguồn</label>
      {retrieve && <label>Bậc học<select aria-label="Bậc học" value={learningLevel} disabled={waiting} onChange={e => setLearningLevel(e.target.value as 'THCS' | 'THPT')}><option value="THPT">THPT</option><option value="THCS">THCS · học liệu nền</option></select></label>}
      {retrieve && <label><input type="checkbox" checked={includeDrafts} disabled={waiting}
        onChange={event => setIncludeDrafts(event.target.checked)}/>Cho phép học liệu chưa duyệt</label>}
      {retrieve && <><label>Cách truy xuất<select aria-label="Cách truy xuất" value={retrievalMethod} disabled={waiting} onChange={e => setRetrievalMethod(e.target.value as 'lexical' | 'vector' | 'hybrid')}><option value="lexical">Từ khóa local</option><option value="vector">Vector local</option><option value="hybrid">Kết hợp BM25 + vector</option></select></label><small>{retrievalMethod === 'hybrid' ? 'Index kết hợp đã build; kết quả vẫn có trạng thái duyệt.' : retrievalMethod === 'vector' ? 'Vector băm từ khóa; chờ mô hình embedding ngữ nghĩa.' : 'Truy xuất local theo từ khóa.'} Lượt đã lưu được ưu tiên khi đính kèm.</small></>}
    </div>
    {serverTutor && <p className="content-note">Gia sư dùng học liệu có nguồn và lượt đã lưu được chọn. Khi chưa bật model hoặc nguồn chưa duyệt, phản hồi theo mẫu.</p>}
    {active && <LumiSavedRuns key={lessonId} lessonId={lessonId} selected={savedRun.lessonId === lessonId ? savedRun.id : ''}
      onSelect={id => setSavedRun({ lessonId, id })} disabled={waiting}/>}
    {attach && !(savedRun.id && savedRun.lessonId === lessonId) && <details className="lumi-snapshot"><summary>Đang dùng: {lessons.find(item => item.id === labId)?.title} · {context.records} số đo</summary><p data-testid="lumi-lab-facts">{context.facts}</p><div>{context.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}<button className="text-button" onClick={openLab}>Trở lại thí nghiệm</button></div><p className="content-note">Số liệu tính tại máy; nguồn mô hình đang chờ duyệt học thuật.</p></details>}
    <div className="chat-messages" aria-live="polite">{messages.length === 0 ? <div className="lumi-welcome"><span className="lumi-orb">✦</span><h2>Hôm nay bạn tò mò điều gì?</h2><p>Bắt đầu bằng một câu hỏi, một công thức<br/>hoặc điều chưa rõ trong bài học.</p><div className="suggestion-grid">{['Tóm tắt kiến thức bài đang chọn', 'Nhắc lại công thức cần nhớ', 'Cho mình một bài tập vận dụng'].map(text => <button key={text} onClick={() => send(text)}>{text} ↗</button>)}</div></div> : messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}><span className="message-author">{message.role === 'user' ? 'Bạn' : '✦ Lumi'}</span><p>{message.text}</p>{message.tutorSource && <span className="message-source">{message.tutorSource}</span>}{message.retrieval && <div aria-label="Học liệu truy xuất">
      <small>Kho {message.retrieval.corpus_revision} · {message.retrieval.retrieval_method === 'local-lexical' ? 'Truy xuất từ khóa local' : message.retrieval.retrieval_method.startsWith('local-hybrid') ? 'Truy xuất kết hợp BM25 + vector' : message.retrieval.retrieval_method === 'local-hash-vector' ? 'Vector băm từ khóa local' : 'Vector ngữ nghĩa local'}</small>
      {message.retrieval.hits.map(hit => <article key={hit.chunk_id}>
        <strong>{hit.document.title}</strong>
        <p>{hit.document.review_status === 'draft' ? 'Dữ liệu chưa duyệt' : hit.document.review_status === 'cross_checked' ? 'Đã đối chiếu · chờ giáo viên duyệt' :
          'Đã duyệt học liệu bởi ' + hit.document.reviewer + ' · ' + hit.document.reviewed_at}</p>
        <p>{hit.document.text}</p>
        <details><summary>Điều kiện và phạm vi</summary><ul>{hit.document.assumptions.map(value => <li key={value}>{value}</li>)}</ul></details>
        {hit.document.provenance && <small>{hit.document.provenance.book} · {hit.document.provenance.chapter} / {hit.document.provenance.section} · {hit.document.provenance.license}</small>}
        <p>Nguồn tham khảo</p>
        <ul>{hit.document.references.map(reference => <li key={reference.url}>
          <a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a>
        </li>)}</ul>
        <small>Mã đoạn {hit.chunk_id}</small>
      </article>)}
    </div>}{message.source && <span className="message-source">Học liệu: {message.source}</span>}</div>)}<div ref={end}/></div><form className="chat-composer" onSubmit={event => { event.preventDefault(); send(input); }}><label className="chat-context">Bài đang hỏi<select aria-label="Bài đang hỏi" disabled={waiting} value={lessonId} onChange={event => { setLessonId(event.target.value); setSavedRun({ lessonId: '', id: '' }); }}>{lessons.map(item => <option key={item.id} value={item.id}>{item.title}{sources.includes(item.id) ? '' : ' (chưa chọn nguồn)'}</option>)}</select></label><div className="chat-input-row"><label className="sr-only" htmlFor="lumi-question">Hỏi Lumi</label><textarea id="lumi-question" rows={2} placeholder="Hỏi Lumi về bài học…" value={input} maxLength={800} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }}/><button className="primary-button" aria-label="Gửi câu hỏi" disabled={waiting || !input.trim()}>↑</button></div><p className="content-note">Phản hồi theo mẫu, có thể dùng số đo của lượt thử đã chọn. Truy xuất học liệu local khi được chọn, phản hồi theo mẫu.</p></form></section>
  </div></section>;
}
