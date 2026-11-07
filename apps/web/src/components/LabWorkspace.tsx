import { lazy, Suspense, useState } from 'react';
import { ExperimentTools } from './ExperimentTools';
import { LabServerPreview } from './LabServerPreview';
import { AppBoundary } from './AppBoundary';
import { PendulumLab } from './PendulumLab';
import { ChemistryLab } from './ChemistryLab';
import { CircuitLab } from './CircuitLab';
import { LabSessionTools, LearningJourney, useLabClock } from './LabSessionTools';
import { labDefinitions, type LabId } from '@lumilab/lab-engine';
import { practiceGroups, practiceIds, practiceInfo } from '../data/practice';
export type { LabId } from '@lumilab/lab-engine';

const MechanicsLab = lazy(() => import('./MechanicsLab').then(m => ({ default: m.MechanicsLab })));
const SpringLab = lazy(() => import('./SpringLab').then(m => ({ default: m.SpringLab })));
const PulleyLab = lazy(() => import('./PulleyLab').then(m => ({ default: m.PulleyLab })));
const AlkaliLab = lazy(() => import('./AlkaliLab').then(m => ({ default: m.AlkaliLab })));
const Hno3Lab = lazy(() => import('./Hno3Lab').then(m => ({ default: m.Hno3Lab })));
const ChlorineLab = lazy(() => import('./ChlorineLab').then(m => ({ default: m.ChlorineLab })));
const ElectrochemistryLab = lazy(() => import('./ElectrochemistryLab').then(m => ({ default: m.ElectrochemistryLab })));
const AtomicLab = lazy(() => import('./AtomicLab').then(m => ({ default: m.AtomicLab })));
const ParallelCircuitLab = lazy(() => import('./AdditionalCircuitLab').then(m => ({ default: m.ParallelCircuitLab })));
const CapacitorLab = lazy(() => import('./AdditionalCircuitLab').then(m => ({ default: m.CapacitorLab })));
const PrecipitationLab = lazy(() => import('./ReactionLab').then(m => ({ default: m.PrecipitationLab })));
const GasReactionLab = lazy(() => import('./ReactionLab').then(m => ({ default: m.GasReactionLab })));

const DampedSpringLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.DampedSpringLab })));
const InclineLab = lazy(() => import('./CurriculumLab').then(m => ({ default: m.InclineLab })));

const renderers: Record<LabId, React.ComponentType> = {
  pendulum: PendulumLab,
  spring: SpringLab,
  mechanics: MechanicsLab,
  pulley: PulleyLab,
  'spring-damped': DampedSpringLab,
  'inclined-plane': InclineLab,
  circuit: CircuitLab,
  capacitor: CapacitorLab,
  'alkali-water': AlkaliLab,
  'copper-nitric': Hno3Lab,
  'chlorine-bleach': ChlorineLab,
  chemistry: ChemistryLab,
  'parallel-circuit': ParallelCircuitLab,
  precipitation: PrecipitationLab,
  'gas-reaction': GasReactionLab,
  electrochemistry: ElectrochemistryLab,
  atomic: AtomicLab,
};

export function LabWorkspace({
  labId,
  onSelect,
  onCatalog,
  onLesson,
  onLumi,
}: {
  labId: LabId;
  onSelect: (id: LabId) => void;
  onCatalog: () => void;
  onLesson: () => void;
  onLumi: () => void;
}) {
  const [speed, setSpeed] = useState(1);
  const [focused, setFocused] = useState(false);
  useLabClock(labId, speed);
  const lab = labDefinitions[labId];
  const Renderer = renderers[labId];
  const group = practiceGroups.find(item => item.modes.includes(labId));

  return (
    <div className={`lab-workspace${focused ? ' is-focused' : ''}`}>
      <div className="workspace-heading">
        <div>
          <button className="lab-back" onClick={onCatalog}>
            ← Danh sách bài thực hành
          </button>
          <p className="breadcrumb">
            {lab.subject === 'physics' ? 'Vật lí' : 'Hóa học'} / {practiceInfo[labId]?.chapter}
          </p>
          <h1>{lab.title}</h1>
        </div>
        <label className="lab-quick-select">
          <span>Chuyển bài</span>
          <select
            aria-label="Chuyển bài thực hành"
            value={labId}
            onChange={e => onSelect(e.target.value as LabId)}
          >
            {['physics', 'chemistry'].map(subject => (
              <optgroup
                key={subject}
                label={subject === 'physics' ? 'Vật lí' : 'Hóa học'}
              >
                {practiceIds
                  .filter(id => labDefinitions[id].subject === subject)
                  .map(id => (
                    <option key={id} value={id}>
                      {labDefinitions[id].title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {group && group.modes.length > 1 && <nav className="mode-switch" aria-label="Chế độ thực hành của bài">
        {group.modes.map(id => <button key={id} className="secondary-button" aria-pressed={labId === id}
          onClick={() => onSelect(id)}>{labDefinitions[id].title}</button>)}
      </nav>}
      <AppBoundary key={`renderer-${labId}`}>
        <Suspense fallback={<div className="lab-opening" role="status">Đang mở bàn thực hành…</div>}>
          <Renderer />
        </Suspense>
      </AppBoundary>
      <ExperimentTools key={`tools-${labId}`} id={labId} speed={speed} onSpeed={setSpeed} focused={focused} onFocus={() => setFocused(value => !value)}/>
      <div className="lab-support">
        <LabSessionTools key={labId} id={labId} />
        <LabServerPreview key={'preview-' + labId} id={labId} />
        <LearningJourney key={`journey-${labId}`} id={labId} onLesson={onLesson} onLumi={onLumi} />
      </div>
    </div>
  );
}
