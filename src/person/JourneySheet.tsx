import { useState } from "react";
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

const HEAD = 24; // 図の上の、段階の名前の行

// 上に段階のタブ、図では選んだ段階の列を囲み、下にその段階の説明を出す（月経管理アプリなどで見慣れた形）
export default function JourneySheet({ stage, onClose }: Props) {
  const [picked, setPicked] = useState<Stage>(stage);
  const here = BANDS[stage];
  const sel = BANDS[picked];
  const info = JOURNEY.stages.find((s) => s.stage === picked);

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={JOURNEY.title}>
      <div className="sheet-body">
        <h1 className="page-title">{JOURNEY.title}</h1>

        <div className="journey-tabs" role="tablist">
          {(Object.keys(BANDS) as Stage[]).map((s) => (
            <button key={s} role="tab" aria-selected={picked === s} onClick={() => setPicked(s)}>
              {JOURNEY.short[s]}
            </button>
          ))}
        </div>

        <svg className="journey-chart" viewBox={`0 0 ${W} ${H + HEAD}`} role="img" aria-label={JOURNEY.title}>
          {(Object.keys(BANDS) as Stage[]).map((s) => (
            <g key={s} onClick={() => setPicked(s)} className="band-group">
              <rect x={BANDS[s].from} y={0} width={BANDS[s].to - BANDS[s].from} height={H + HEAD} className="band" />
              <text x={(BANDS[s].from + BANDS[s].to) / 2} y={16} className="band-label" textAnchor="middle">
                {JOURNEY.short[s]}
              </text>
            </g>
          ))}
          <line x1={0} y1={HEAD} x2={W} y2={HEAD} className="band-head-line" />
          {/* 選んだ段階の列を、色で囲む */}
          <rect x={sel.from + 1} y={1} width={sel.to - sel.from - 2} height={H + HEAD - 2} className="band-picked" />
          <rect x={sel.from + 1} y={1} width={sel.to - sel.from - 2} height={HEAD - 1} className="band-picked-head" />
          <text x={(sel.from + sel.to) / 2} y={16} className="band-label band-label-picked" textAnchor="middle">
            {JOURNEY.short[picked]}
          </text>
          <g transform={`translate(0 ${HEAD})`}>
            <polyline points={CURVE.map(([x, y]) => `${x},${y}`).join(" ")} className="curve" />
            <circle cx={here.dot[0]} cy={here.dot[1]} r={6} className="now-dot" />
            <text x={here.dot[0]} y={here.dot[1] - 12} className="now-label" textAnchor="middle">
              {JOURNEY.now}
            </text>
          </g>
        </svg>

        <div className="journey-info">
          <p className="journey-name">
            {STAGE_LABELS[picked]}
            {picked === stage && <span className="tag-soft">{JOURNEY.nowTag}</span>}
          </p>
          <p className="journey-body">{info?.body}</p>
        </div>
        <p className="muted">{JOURNEY.lead}</p>
        <p className="muted">{JOURNEY.paceNote}</p>

        <button className="btn-outline btn-wide" onClick={onClose}>
          {JOURNEY.close}
        </button>
      </div>
    </div>
  );
}
