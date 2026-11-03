import { ANALYTICS } from "../constants/labels";
import {
  AVG_LEAVE_DAYS,
  BY_AGE,
  BY_DEPT,
  BY_JOB,
  BY_PATH,
  BY_YEAR,
  ENDED,
  PERFORMANCE,
  RELAPSED_1Y,
  RETURNED,
  THIS_YEAR,
  percent,
} from "../data/analyticsSample";

// データ分析（見本の数字）。回復期の過ごし方ごとに、復職と再休職がどう違うかを、会社が自社の数字で確かめる
export default function Analytics() {
  const answered = Object.values(PERFORMANCE).flat().reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="hr-head">
        <div>
          <h1 className="hr-title">{ANALYTICS.title}</h1>
          <p className="muted an-sample">{ANALYTICS.sample}</p>
        </div>
      </div>

      <div className="an-tiles">
        <Tile label={ANALYTICS.returnRate} value={percent(RETURNED, ENDED)} unit="%" note={ANALYTICS.returnRateNote(ENDED)} />
        <Tile label={ANALYTICS.relapse} value={percent(RELAPSED_1Y, RETURNED)} unit="%" note={ANALYTICS.relapseNote(RETURNED)} />
        <Tile label={ANALYTICS.avgDays} value={AVG_LEAVE_DAYS} unit="日" note={ANALYTICS.avgDaysNote} />
        <Tile label={ANALYTICS.thisYear} value={THIS_YEAR} unit="人" note={ANALYTICS.thisYearNote} />
      </div>

      <section className="hr-card">
        <h2>{ANALYTICS.trendTitle}</h2>
        <p className="muted">{ANALYTICS.trendNote}</p>
        <div className="an-row-3 an-trends">
          <Trend
            title={ANALYTICS.trendStarted}
            unit="人"
            points={BY_YEAR.map((y) => ({ year: y.year, value: y.started, partial: y.partial }))}
            bars
          />
          <Trend
            title={ANALYTICS.trendReturn}
            unit="%"
            max={100}
            points={BY_YEAR.map((y) => ({ year: y.year, value: percent(y.returned, y.ended), detail: `${y.returned}/${y.ended}人`, partial: y.partial }))}
          />
          <Trend
            title={ANALYTICS.trendRelapse}
            unit="%"
            max={50}
            points={BY_YEAR.map((y) => ({
              year: y.year,
              value: y.relapsed === null ? null : percent(y.relapsed, y.returned),
              detail: y.relapsed === null ? undefined : `${y.relapsed}/${y.returned}人`,
            }))}
          />
        </div>
        <p className="muted an-trend-note">{ANALYTICS.trendPendingNote}</p>
      </section>

      <details className="hr-card an-defs">
        <summary>{ANALYTICS.defTitle}</summary>
        <dl>
          {ANALYTICS.defs.map((d) => (
            <div key={d.term}>
              <dt>{d.term}</dt>
              <dd>{d.body}</dd>
            </div>
          ))}
        </dl>
      </details>

      <div className="an-row">
        <section className="hr-card an-rework">
          <h2>{ANALYTICS.pathTitle}</h2>
          <p className="muted">{ANALYTICS.pathNote}</p>
          <h3>{ANALYTICS.returnRate}</h3>
          {BY_PATH.map((p) => (
            <Bar
              key={p.key}
              label={ANALYTICS.paths[p.key]}
              // 復職率の分母は、休職が終わった人（まだ休職中の人は入れない）
              value={percent(p.returned, p.returned + p.left)}
              max={100}
              unit="%"
              detail={`${p.returned}/${p.returned + p.left}人`}
            />
          ))}
          <h3>{ANALYTICS.relapse}</h3>
          {BY_PATH.map((p) => (
            <Bar
              key={p.key}
              label={ANALYTICS.paths[p.key]}
              value={percent(p.relapsed, p.returned)}
              max={100}
              unit="%"
              detail={`${p.relapsed}/${p.returned}人`}
            />
          ))}
        </section>

        <section className="hr-card">
          <h2>{ANALYTICS.perfTitle}</h2>
          <p className="muted">{ANALYTICS.perfNote(answered)}</p>
          {BY_PATH.map((p) => (
            <Stack key={p.key} label={ANALYTICS.paths[p.key]} counts={PERFORMANCE[p.key]} />
          ))}
          <ul className="an-legend">
            {ANALYTICS.perfLevels.map((l, i) => (
              <li key={l}>
                <span className={`an-swatch an-level-${i}`} />
                {l}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="an-row an-row-3">
        <Breakdown title={ANALYTICS.byDept} rows={BY_DEPT} />
        <Breakdown title={ANALYTICS.byAge} rows={BY_AGE} />
        <Breakdown title={ANALYTICS.byJob} rows={BY_JOB} />
      </div>

      <ul className="muted an-notes">
        {ANALYTICS.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </>
  );
}

// 年度ごとの推移。人数は棒、割合は線。値は文字でも出す（色だけに頼らない）。途中の年度・集計中は区別する
type TrendPoint = { year: number; value: number | null; detail?: string; partial?: boolean };
function Trend({ title, unit, points, max, bars = false }: { title: string; unit: string; points: TrendPoint[]; max?: number; bars?: boolean }) {
  const W = 300;
  const H = 150;
  const top = 22;
  const bottom = 24;
  const top_ = Math.max(...points.map((p) => p.value ?? 0));
  const scaleMax = max ?? Math.ceil((top_ * 1.2) / 5) * 5;
  const step = W / points.length;
  const x = (i: number) => step * i + step / 2;
  const y = (v: number) => H - bottom - (v / scaleMax) * (H - top - bottom);
  const line = points
    .map((p, i) => (p.value === null ? null : `${x(i)},${y(p.value)}`))
    .filter(Boolean)
    .join(" ");
  return (
    <figure className="an-trend">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}：${points.map((p) => `${p.year}年度 ${p.value ?? ANALYTICS.trendPending}`).join("、")}`}>
        <line x1={0} x2={W} y1={H - bottom} y2={H - bottom} className="an-axis" />
        {bars
          ? points.map((p, i) =>
              p.value === null ? null : (
                <rect
                  key={p.year}
                  x={x(i) - 14}
                  y={y(p.value)}
                  width={28}
                  height={H - bottom - y(p.value)}
                  rx={4}
                  className={p.partial ? "an-trend-bar an-partial" : "an-trend-bar"}
                >
                  <title>{`${p.year}年度：${p.value}${unit}`}</title>
                </rect>
              ),
            )
          : <polyline points={line} className="an-trend-line" />}
        {points.map((p, i) => (
          <g key={p.year}>
            {!bars && p.value !== null && (
              <circle cx={x(i)} cy={y(p.value)} r={4.5} className={p.partial ? "an-trend-dot an-partial" : "an-trend-dot"}>
                <title>{`${p.year}年度：${p.value}${unit}${p.detail ? `（${p.detail}）` : ""}`}</title>
              </circle>
            )}
            <text x={x(i)} y={p.value === null ? H - bottom - 8 : y(p.value) - 8} textAnchor="middle" className="an-trend-val">
              {p.value === null ? ANALYTICS.trendPending : p.value}
            </text>
            <text x={x(i)} y={H - 8} textAnchor="middle" className="an-trend-year">
              {p.year}
              {p.partial ? `（${ANALYTICS.trendPartial}）` : ""}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function Tile({ label, value, unit, note }: { label: string; value: number; unit: string; note: string }) {
  return (
    <div className="tile">
      <p className="tile-label">{label}</p>
      <p className="an-value">
        {value}
        <span className="an-unit">{unit}</span>
      </p>
      <p className="muted an-tile-note">{note}</p>
    </div>
  );
}

// 横棒1本。数字は棒の外に文字で出す（色だけに頼らない）
// 割合には人数を添える（10人中9人か、2人中2人かで、説明の重みが違うため）
function Bar({ label, value, max, unit, detail }: { label: string; value: number; max: number; unit: string; detail?: string }) {
  const tip = `${label}：${value}${unit}${detail ? `（${detail}）` : ""}`;
  return (
    <div className={`an-bar${detail ? " an-bar-detail" : ""}`} title={tip}>
      <span className="an-bar-label">{label}</span>
      <span className="an-track">
        <span className="an-fill" style={{ width: `${(value / max) * 100}%` }} />
      </span>
      <span className="an-bar-value">
        {value}
        {unit}
        {detail && <span className="an-bar-count">（{detail}）</span>}
      </span>
    </div>
  );
}

// 上司アンケートの内訳。段階の順に、濃い色 → 薄い色
function Stack({ label, counts }: { label: string; counts: number[] }) {
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <div className="an-bar">
      <span className="an-bar-label">{label}</span>
      <span className="an-stack">
        {counts.map((c, i) =>
          c === 0 ? null : (
            <span
              key={i}
              className={`an-seg an-level-${i}`}
              style={{ width: `${(c / total) * 100}%` }}
              title={`${label}・${ANALYTICS.perfLevels[i]}：${c}人`}
            />
          ),
        )}
      </span>
      <span className="an-bar-value">{total}人</span>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(...rows.map(([, n]) => n));
  return (
    <section className="hr-card">
      <h2>{title}</h2>
      <p className="muted">{ANALYTICS.period}</p>
      {rows.map(([name, n]) => (
        <Bar key={name} label={name} value={n} max={max} unit="人" />
      ))}
    </section>
  );
}
