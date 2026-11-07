import { useState } from 'react';
import { labDefinitions, type LabId } from '@lumilab/lab-engine';
import { practiceGroups, practiceInfo } from '../data/practice';

function Preview({ id }: { id: LabId }) {
  return (
    <svg viewBox="0 0 320 140" aria-hidden="true" className="practice-preview">
      <defs>
        <pattern id={`grid-${id}`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="currentColor" opacity="0.14" />
        </pattern>
      </defs>
      <rect width="320" height="140" fill={`url(#grid-${id})`} />
      <path d="M24 118h272" stroke="currentColor" opacity=".16" strokeWidth="2" />

      {id === 'pendulum' ? (
        <g>
          <path d="M118 20h84" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M160 20v88" stroke="currentColor" opacity=".25" strokeDasharray="4 4" strokeWidth="1.5" />
          <path d="M126 96a68 68 0 0 0 68 0" fill="none" stroke="#14798f" opacity=".4" strokeDasharray="3 3" strokeWidth="1.5" />
          <path d="M160 20l44 64" stroke="currentColor" strokeWidth="2.8" />
          <circle cx="204" cy="84" r="16" fill="currentColor" opacity=".75" />
          <circle cx="200" cy="80" r="5" fill="#fff" opacity=".45" />
          <path d="M204 84v24m0 0-4-5m4 5 4-5" stroke="#c97a16" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </g>
      ) : id === 'spring' ? (
        <g>
          <rect x="46" y="42" width="12" height="58" rx="3" fill="currentColor" opacity=".55" />
          <path d="M58 72h16l7-14 11 28 11-28 11 28 11-28 11 28 11-28 11 28 7-14h18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <rect x="183" y="49" width="52" height="46" rx="9" fill="currentColor" opacity=".68" />
          <circle cx="209" cy="72" r="7" fill="#fff" stroke="#14798f" strokeWidth="2.5" />
          <path d="M183 72h-26m0 0 6-5m-6 5 6 5" stroke="#c97a16" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
      ) : id === 'mechanics' ? (
        <g>
          <circle cx="64" cy="84" r="3" fill="#14798f" opacity=".3" />
          <circle cx="88" cy="84" r="3.5" fill="#14798f" opacity=".45" />
          <circle cx="122" cy="84" r="4" fill="#14798f" opacity=".65" />
          <rect x="134" y="64" width="84" height="34" rx="8" fill="currentColor" opacity=".65" />
          <rect x="154" y="48" width="42" height="16" rx="4" fill="#c97a16" opacity=".55" />
          <circle cx="154" cy="105" r="9" fill="currentColor" />
          <circle cx="198" cy="105" r="9" fill="currentColor" />
          <path d="M220 80h54m0 0-9-6m9 6-9 6" fill="none" stroke="#c97a16" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : id === 'pulley' ? (
        <g>
          <path d="M96 20h128" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <circle cx="145" cy="42" r="14" fill="#fff" stroke="currentColor" strokeWidth="3" />
          <circle cx="185" cy="42" r="12" fill="#fff" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="145" cy="80" r="13" fill="#fff" stroke="#14798f" strokeWidth="2.8" />
          <path d="M131 42v38m28-38v38M197 42v48" stroke="#c97a16" strokeWidth="2.6" />
          <rect x="126" y="96" width="38" height="22" rx="5" fill="currentColor" opacity=".75" />
          <rect x="189" y="88" width="16" height="26" rx="4" fill="#fff8eb" stroke="#c97a16" strokeWidth="2" />
        </g>
      ) : id === 'parallel-circuit' ? (
        <g>
          <path d="M76 50V32h168v76H76V76M116 32v40h100V32" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M66 53h20M71 69h10" stroke="currentColor" strokeWidth="3" />
          <rect x="144" y="23" width="44" height="18" rx="4" fill="#c97a16" opacity=".7" />
          <rect x="144" y="63" width="44" height="18" rx="4" fill="#14798f" opacity=".7" />
          <circle cx="218" cy="108" r="13" fill="#fff" stroke="currentColor" strokeWidth="2" />
          <text x="218" y="112" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700">A</text>
        </g>
      ) : id === 'capacitor' ? (
        <g>
          <path d="M74 52V32h112v28m0 20v28H74V72" fill="none" stroke="currentColor" strokeWidth="2.8" />
          <path d="M64 54h20M69 68h10" stroke="currentColor" strokeWidth="3" />
          <rect x="112" y="24" width="38" height="16" rx="4" fill="#c97a16" opacity=".65" />
          <path d="M170 60h32M170 78h32" stroke="#14798f" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M218 98q16-56 58-62" fill="none" stroke="#1f7054" strokeWidth="2.5" />
        </g>
      ) : id === 'circuit' ? (
        <g>
          <path d="M90 51V32h145v70H90V73" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M80 54h20M85 69h10" stroke="currentColor" strokeWidth="3" />
          <rect x="146" y="23" width="40" height="19" rx="4" fill="#c97a16" opacity=".7" />
          <circle cx="211" cy="102" r="15" fill="#edf6f2" stroke="currentColor" strokeWidth="2" />
          <text x="211" y="107" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">A</text>
        </g>
      ) : id === 'chemistry' ? (
        <g>
          <path d="M218 16v99m-16 0h32M218 32h-34" stroke="currentColor" strokeWidth="2.5" opacity=".35" strokeLinecap="round" />
          <rect x="178" y="16" width="12" height="52" rx="3" fill="currentColor" opacity=".45" />
          <path d="M174 58h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="184" cy="74" r="2.5" fill="#d94e8f" />
          <path d="M171 80v8l-19 26h64l-19-26v-8" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M159 104h50l7 10h-64z" fill="#d94e8f" opacity=".35" />
          <rect x="82" y="60" width="34" height="54" rx="6" fill="currentColor" opacity=".2" />
          <path d="M89 60v-8h20v8" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="99" y="92" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600">pH</text>
        </g>
      ) : id === 'precipitation' ? (
        <g>
          <rect x="74" y="48" width="28" height="42" rx="5" fill="currentColor" opacity=".22" transform="rotate(-18 88 69)" />
          <rect x="218" y="48" width="28" height="42" rx="5" fill="currentColor" opacity=".22" transform="rotate(18 232 69)" />
          <path d="M126 52v54q0 8 8 8h52q8 0 8-8V52" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M128 74h64v32q0 6-6 6h-52q-6 0-6-6z" fill="currentColor" opacity=".16" />
          <path d="M130 101q30-6 60 0v7q0 5-5 5h-50q-5 0-5-5z" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="145" cy="94" r="3" fill="#ffffff" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="160" cy="91" r="3.5" fill="#ffffff" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="175" cy="95" r="3" fill="#ffffff" stroke="currentColor" strokeWidth="1.2" />
          <text x="160" y="42" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600">AgCl↓</text>
        </g>
      ) : id === 'gas-reaction' ? (
        <g>
          <path d="M122 50v56q0 8 8 8h56q8 0 8-8V50" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M124 78h68v28q0 6-6 6h-56q-6 0-6-6z" fill="currentColor" opacity=".2" />
          <circle cx="144" cy="88" r="3.5" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="160" cy="76" r="4.5" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="173" cy="84" r="3" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="154" cy="60" r="4" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="168" cy="52" r="3" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
          <path d="M180 50V32h44v24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
          <rect x="212" y="56" width="24" height="44" rx="4" fill="currentColor" opacity=".22" stroke="currentColor" strokeWidth="1.8" />
          <text x="158" y="36" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600">CO₂↑</text>
        </g>
      ) : id === 'electrochemistry' ? (
        <g>
          <path d="M85 60v45h55V60m45 0v45h55V60" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M112 75V30h101v45M130 84V55h68v29" fill="none" stroke="currentColor" strokeWidth="3" opacity=".5" />
          <path d="M111 65v33m102-33v33" stroke="currentColor" strokeWidth="9" opacity=".5" />
          <circle cx="162" cy="30" r="15" fill="#f2edf8" stroke="currentColor" strokeWidth="2" />
          <text x="162" y="35" textAnchor="middle" fontSize="13" fill="currentColor" fontWeight="700">V</text>
        </g>
      ) : id === 'atomic' ? (
        <g>
          <circle cx="160" cy="65" r="15" fill="currentColor" opacity=".45" />
          <ellipse cx="160" cy="65" rx="62" ry="26" stroke="currentColor" fill="none" opacity=".35" />
          <ellipse cx="160" cy="65" rx="62" ry="26" stroke="currentColor" fill="none" opacity=".35" transform="rotate(60 160 65)" />
          <ellipse cx="160" cy="65" rx="62" ry="26" stroke="currentColor" fill="none" opacity=".35" transform="rotate(120 160 65)" />
          <circle cx="222" cy="65" r="5" fill="currentColor" />
          <circle cx="130" cy="111" r="5" fill="currentColor" />
        </g>
      ) : id === 'alkali-water' ? (
        <g>
          <path d="M88 54v44q0 16 16 16h112q16 0 16-16V54" fill="#fff" fillOpacity=".65" stroke="currentColor" strokeWidth="2.5" />
          <path d="M91 74v24q0 13 13 13h112q13 0 13-13V74z" fill="#ec4899" opacity=".32" />
          <circle cx="156" cy="72" r="8" fill="#64748b" />
          <path d="M156 64q6-24 0-34q-8 12 0 34z" fill="#f59e0b" />
          <circle cx="140" cy="56" r="3.5" fill="currentColor" opacity=".4" />
          <circle cx="172" cy="50" r="4.5" fill="currentColor" opacity=".35" />
        </g>
      ) : id === 'copper-nitric' ? (
        <g>
          <path d="M142 26v72q0 18 18 18q18 0 18-18V26" fill="#fff" fillOpacity=".7" stroke="currentColor" strokeWidth="2.6" />
          <path d="M145 72v26q0 15 15 15q15 0 15-15V72z" fill="#0284c7" opacity=".45" />
          <rect x="150" y="102" width="20" height="8" rx="2" fill="#b45309" />
          <ellipse cx="160" cy="48" rx="14" ry="18" fill="#b45309" opacity=".48" />
          <circle cx="156" cy="84" r="3" fill="#fff" />
          <circle cx="165" cy="76" r="3.5" fill="#fff" />
        </g>
      ) : (
        <g>
          <circle cx="104" cy="88" r="24" fill="#eab308" opacity=".28" stroke="currentColor" strokeWidth="2.4" />
          <path d="M104 64V44h64v22" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <rect x="152" y="56" width="32" height="56" rx="5" fill="#84cc16" opacity=".28" stroke="currentColor" strokeWidth="2.2" />
          <rect x="163" y="68" width="10" height="32" rx="2" fill="#ec4899" opacity=".75" />
          <path d="M184 68h42v24" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <rect x="212" y="84" width="28" height="28" rx="4" fill="#bae6fd" stroke="currentColor" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

export function PracticeCatalog({ onOpen, onLesson }: { onOpen: (id: LabId) => void; onLesson: (id: LabId) => void }) {
  const [subject, setSubject] = useState('all');
  const [query, setQuery] = useState('');
  const normalize = (text: string) => text.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
  const shown = practiceGroups.filter(({ primary, title, modes }) =>
    (subject === 'all' || labDefinitions[primary].subject === subject) &&
    normalize([title, practiceInfo[primary].chapter, ...modes.map(id => labDefinitions[id].title)].join(' ')).includes(normalize(query.trim())));

  return (
    <section className="practice-catalog">
      <div className="workspace-heading">
        <div>
          <p className="breadcrumb">Chọn một câu hỏi, bắt đầu khám phá</p>
          <h1>Phòng thực hành</h1>
          <p>Mỗi bàn thí nghiệm cho phép kéo thả trực tiếp dụng cụ, quan sát hiện tượng động và ghi sổ đo đối chiếu.</p>
        </div>
        <span className="soft-tag">
          {practiceGroups.filter(({ primary }) => labDefinitions[primary].subject === 'physics').length} bài Vật lí ·{' '}
          {practiceGroups.filter(({ primary }) => labDefinitions[primary].subject === 'chemistry').length} bài Hóa học
        </span>
      </div>

      <div className="practice-filter">
        <div className="segmented" role="group" aria-label="Lọc môn thực hành">
          {[['all', 'Tất cả'], ['physics', 'Vật lí'], ['chemistry', 'Hóa học']].map(([key, label]) => (
            <button key={key} aria-pressed={subject === key} onClick={() => setSubject(key)}>{label}</button>
          ))}
        </div>
        <label>
          <span className="sr-only">Tìm bài thực hành</span>
          <input
            type="search"
            aria-label="Tìm bài thực hành"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm bài thực hành, chủ đề…"
          />
        </label>
      </div>

      <p className="practice-count" role="status">{shown.length} bài thực hành</p>

      <div className="practice-grid">
        {shown.map(({ primary: id, title, modes }) => {
          const definition = labDefinitions[id];
          const info = practiceInfo[id];
          return (
            <article key={id} data-testid={`practice-card-${id}`} className={`practice-card ${definition.subject}`}>
              <div className="practice-art">
                <span>{definition.subject === 'physics' ? 'Vật lí' : 'Hóa học'}</span>
                <em>{modes.length > 1 ? `${modes.length} chế độ` : 'Tương tác trực tiếp'}</em>
                <Preview id={id} />
              </div>
              <div className="practice-card-body">
                <span className="practice-chapter">{info.chapter}</span>
                <h2>{title}</h2>
                <p>{info.lead}</p>
                <span className="practice-action">
                  {modes.length > 1 ? modes.map(mode => labDefinitions[mode].title).join(' · ') : info.action}
                </span>
                <div className="practice-card-buttons">
                  <button
                    className="primary-button"
                    aria-label={`Mở bài thực hành ${definition.title}`}
                    onClick={() => onOpen(id)}
                  >
                    Vào thực hành
                  </button>
                  <button className="text-button" onClick={() => onLesson(id)}>Xem bài học</button>
                </div>
                {modes.filter(mode => mode !== id).map(mode => (
                  <button key={mode} className="text-button practice-submode-btn" onClick={() => onOpen(mode)}>
                    {labDefinitions[mode].title}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {shown.length === 0 && (
        <div className="practice-empty">
          <h2>Chưa tìm thấy bài phù hợp</h2>
          <p>Thử tên môn, chủ đề khác hoặc xóa bộ lọc.</p>
          <button className="secondary-button" onClick={() => { setQuery(''); setSubject('all'); }}>Xóa bộ lọc</button>
        </div>
      )}
    </section>
  );
}
