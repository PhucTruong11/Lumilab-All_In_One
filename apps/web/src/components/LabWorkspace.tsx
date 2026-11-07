import { lazy, Suspense } from 'react';
import { LabServerPreview } from './LabServerPreview';
import { AppBoundary } from './AppBoundary';
import { PendulumLab } from './PendulumLab';
import { ChemistryLab } from './ChemistryLab';
import { CircuitLab } from './CircuitLab';
import { LabSessionTools, LearningJourney, useLabClock } from './LabSessionTools';
import { labDefinitions, type LabId } from '@lumilab/lab-engine';
import { archivedPracticeIds, practiceGroups, practiceIds, practiceInfo } from '../data/practice';
export type { LabId } from '@lumilab/lab-engine';
const MechanicsLab = lazy(() => import('./MechanicsLab').then(m => ({ default: m.MechanicsLab })));
const SpringLab = lazy(() => import('./SpringLab').then(m => ({ default: m.SpringLab })));
const ElectrochemistryLab = lazy(() => import('./ElectrochemistryLab').then(m => ({ default: m.ElectrochemistryLab })));
const AtomicLab = lazy(() => import('./AtomicLab').then(m => ({ default: m.AtomicLab })));
const ParallelCircuitLab = lazy(() => import('./AdditionalCircuitLab').then(m => ({ default: m.ParallelCircuitLab })));
const CapacitorLab = lazy(() => import('./AdditionalCircuitLab').then(m => ({ default: m.CapacitorLab })));
const PrecipitationLab = lazy(() => import('./ReactionLab').then(m => ({ default: m.PrecipitationLab })));
const GasReactionLab = lazy(() => import('./ReactionLab').then(m => ({ default: m.GasReactionLab })));
const DampedSpringLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.DampedSpringLab })));
const InclineLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.InclineLab })));
const PulleyLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.PulleyLab })));
const AlkaliWaterLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.AlkaliWaterLab })));
const CopperNitricLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.CopperNitricLab })));
const ChlorineLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.ChlorineLab })));
const renderers = { pendulum: PendulumLab, chemistry: ChemistryLab, circuit: CircuitLab, mechanics: MechanicsLab, spring: SpringLab, electrochemistry: ElectrochemistryLab, atomic: AtomicLab, 'parallel-circuit': ParallelCircuitLab, capacitor: CapacitorLab, precipitation: PrecipitationLab, 'gas-reaction': GasReactionLab,
  'spring-damped': DampedSpringLab,
  'inclined-plane': InclineLab,
  'pulley': PulleyLab,
  'alkali-water': AlkaliWaterLab,
  'copper-nitric': CopperNitricLab,
  'chlorine-bleach': ChlorineLab,
};
export function LabWorkspace({ labId, onSelect, onCatalog, onLesson, onLumi }: { labId: LabId; onSelect: (id: LabId) => void; onCatalog: () => void; onLesson: () => void; onLumi: () => void }) {
  useLabClock(labId);
  const lab = labDefinitions[labId]; const Renderer = renderers[labId];
  const group = practiceGroups.find(item => item.modes.includes(labId));
  return <>
    <div className="workspace-heading"><div><button className="lab-back" onClick={onCatalog}>← Danh sách bài thực hành</button><p className="breadcrumb">{lab.subject === 'physics' ? 'Vật lí' : 'Hóa học'} / {practiceInfo[labId].chapter}</p><h1>{lab.title}</h1></div><label className="lab-quick-select"><span>Chuyển bài</span><select aria-label="Chuyển bài thực hành" value={labId} onChange={e => onSelect(e.target.value as LabId)}>{['physics', 'chemistry'].map(subject => <optgroup key={subject} label={subject === 'physics' ? 'Vật lí' : 'Hóa học'}>{practiceIds.filter(id => labDefinitions[id].subject === subject).map(id => <option key={id} value={id}>{labDefinitions[id].title}</option>)}</optgroup>)}<optgroup label="Bài lưu trữ — tương thích phiên cũ">{archivedPracticeIds.map(id => <option key={id} value={id}>{labDefinitions[id].title}</option>)}</optgroup></select></label></div>
    <LabSessionTools key={labId} id={labId}/><AppBoundary key={`renderer-${labId}`}><Suspense fallback={<div className="lab-opening" role="status">Đang mở bàn thực hành…</div>}><Renderer/></Suspense></AppBoundary>
    {group && group.modes.length > 1 && <nav className="button-row" aria-label="Chế độ thực hành của bài">
      {group.modes.map(mode => <button key={mode} type="button" className={mode === labId ? 'primary-button' : 'secondary-button'}
        aria-current={mode === labId ? 'page' : undefined} onClick={() => onSelect(mode)}>{labDefinitions[mode].title}</button>)}
    </nav>}
    <LabServerPreview key={'preview-' + labId} id={labId}/>
    <LearningJourney key={`journey-${labId}`} id={labId} onLesson={onLesson} onLumi={onLumi}/>
  </>;
}
