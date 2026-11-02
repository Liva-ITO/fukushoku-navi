import { JOURNEY, STAGE_LABELS, type Stage } from "../constants/labels";

type Props = { stage: Stage; onClose: () => void };

// 調子の線は、まっすぐではなく波を描きながら上がっていく（後退ではなく、回復の途中の波）
const CURVE: [number, number][] = [
  [0, 45], [12, 55], [22, 50], [34, 80], [46, 110], [58, 128], [70, 135], [80, 130], [92, 136],
  [104, 124], [116, 128], [128, 112], [140, 118], [152, 100], [164, 106], [176, 88], [188, 94],
  [200, 76], [212, 82], [224, 66], [236, 70], [248, 56], [260, 60], [272, 48], [284, 50],
  [296, 44], [310, 47], [324, 42], [340, 44],
];

// 段階ごとの横の範囲と、「いまここ」の位置
const BANDS: Record<Stage, { from: number; to: number; dot: [number, number] }> = {
  acute: { from: 0, to: 84, dot: [70, 135] },
  recovery: { from: 84, to: 222, dot: [152, 100] },
  preReturn: { from: 222, to: 282, dot: [248, 56] },
  afterReturn: { from: 282, to: 340, dot: [310, 47] },
};

const W = 340;
const H = 170;

export default function JourneySheet({ stage, onClose }: Props) {
  const here = BANDS[stage];

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={JOURNEY.title}>
      <div className="sheet-body">
        <h1 className="page-title">{JOURNEY.title}</h1>
        <p className="journey-lead">{JOURNEY.lead}</p>

        <svg className="journey-chart" viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label={JOURNEY.title}>
          {(Object.keys(BANDS) as Stage[]).map((s) => (
            <g key={s}>
              <rect
                x={BANDS[s].from}
                y={0}
                width={BANDS[s].to - BANDS[s].from}
                height={H}
                className={s === stage ? "band band-now" : "band"}
              />
              <text x={(BANDS[s].from + BANDS[s].to) / 2} y={H + 16} className="band-label" textAnchor="middle">
                {STAGE_LABELS[s].replace("（見守りモード）", "")}
              </text>
            </g>
          ))}
          <polyline points={CURVE.map(([x, y]) => `${x},${y}`).join(" ")} className="curve" />
          <circle cx={here.dot[0]} cy={here.dot[1]} r={6} className="now-dot" />
          <text x={here.dot[0]} y={here.dot[1] - 12} className="now-label" textAnchor="middle">
            {JOURNEY.now}
          </text>
        </svg>

        <ol className="journey-list">
          {JOURNEY.stages.map((s) => (
            <li key={s.stage} className={s.stage === stage ? "journey-item journey-item-now" : "journey-item"}>
              <p className="journey-name">
                {STAGE_LABELS[s.stage]}
                {s.duration && <span className="muted">　目安 {s.duration}</span>}
                {s.stage === stage && <span className="tag-soft">{JOURNEY.now}</span>}
              </p>
              <p className="journey-body">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="muted">{JOURNEY.durationNote}</p>

        <button className="btn-outline btn-wide" onClick={onClose}>
          {JOURNEY.close}
        </button>
      </div>
    </div>
  );
}
