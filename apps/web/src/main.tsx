import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LabWorkspace, type LabId } from './components/LabWorkspace';
import { LessonLibrary } from './components/LessonLibrary';
import { LearningWorkspace } from './components/LearningWorkspace';
import { LumiChat } from './components/LumiChat';
import './styles.css';
import './learning.css';
import './labs.css';
import './completion.css';
import { LabSessionProvider } from './labSession';
import { AppBoundary } from './components/AppBoundary';
import { PracticeCatalog } from './components/PracticeCatalog';
import { isLabId } from '@lumilab/lab-engine';
import './practice.css';

type View = 'lab' | 'library' | 'workspace' | 'lumi';
const tabs: { id: View; label: string }[] = [
  { id: 'lab', label: 'Phòng thực hành' }, { id: 'library', label: 'Thư viện bài học' },
  { id: 'workspace', label: 'Không gian học tập' }, { id: 'lumi', label: '✦ Lumi' },
];
function App() {
  const [view, setView] = useState<View>('lab');
  const [labOpen, setLabOpen] = useState(false);
  const [labId, setLabId] = useState<LabId>('pendulum');
  const [lessonRequest, setLessonRequest] = useState<{ id: string; sequence: number } | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  function navigate(next: View, id?: LabId) { location.hash = next === 'lab' ? id ? `lab/${id}` : 'lab' : next; if (id) setLabId(id); if (next === 'lab') setLabOpen(!!id); setView(next); }
  function openLesson(id: string) { setLessonRequest(previous => ({ id, sequence: (previous?.sequence || 0) + 1 })); navigate('library'); }
  useEffect(() => {
    const route = () => { const [next, id] = location.hash.slice(1).split('/'); if (tabs.some(tab => tab.id === next)) { setView(next as View); window.scrollTo({ top: 0, behavior: 'instant' }); } if (next === 'lab') { setLabOpen(isLabId(id || '')); if (isLabId(id || '')) setLabId(id as LabId); } };
    const network = () => setOnline(navigator.onLine); route(); addEventListener('hashchange', route); addEventListener('online', network); addEventListener('offline', network);
    return () => { removeEventListener('hashchange', route); removeEventListener('online', network); removeEventListener('offline', network); };
  }, []);
  return <>
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <header className="site-header">
      <a className="brand" href="#lab" onClick={event => { event.preventDefault(); navigate('lab'); }} aria-label="LumiLab trang chính"><span className="brand-mark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M12 5h8m-6 0v8L7 25q-1 2 2 2h14q3 0 2-2l-7-12V5M10 21h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="15" cy="23" r="1" fill="currentColor"/></svg></span>Lumi<span>Lab</span></a>
      <nav aria-label="Điều hướng chính">{tabs.map(tab => <button key={tab.id} className={view === tab.id ? 'nav-link active' : 'nav-link'} aria-current={view === tab.id ? 'page' : undefined} onClick={() => navigate(tab.id)}>{tab.label}</button>)}</nav>
      {!online && <span className="header-status offline-status" role="status">Ngoại tuyến · Dữ liệu trên máy</span>}
    </header>
    <main id="main-content" tabIndex={-1} className="w-full"><AppBoundary>
      {view === 'lab' && !labOpen && <PracticeCatalog onOpen={id => navigate('lab', id)} onLesson={id => openLesson(id)}/>}
      {view === 'lab' && labOpen && <LabWorkspace labId={labId} onSelect={id => navigate('lab', id)} onCatalog={() => navigate('lab')} onLesson={() => openLesson(labId)} onLumi={() => navigate('lumi')}/>}
      <div hidden={view !== 'library'}><LessonLibrary requested={lessonRequest} openLab={id => navigate('lab', id)}/></div>
      <div hidden={view !== 'workspace'}><LearningWorkspace openLab={id => navigate('lab', id)}/></div>
      <div hidden={view !== 'lumi'}><LumiChat active={view === 'lumi'} labId={labId} openLab={() => navigate('lab', labId)}/></div>
    </AppBoundary></main>
    <footer className="site-footer"><span>LumiLab <span className="footer-spark">science, with a little spark.</span></span><span>Mô phỏng bổ trợ thực hành</span></footer>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><LabSessionProvider><App/></LabSessionProvider></StrictMode>);
