import { ANALYTICS } from "../constants/labels";
import {
  AVG_LEAVE_DAYS,
  BY_AGE,
  BY_DEPT,
  BY_JOB,
  PERFORMANCE,
  PERIOD_PEOPLE,
  RELAPSED_1Y,
  RETURNED,
  REWORK,
  THIS_YEAR,
  percent,
} from "../data/analyticsSample";

// データ分析（見本の数字）。いちばん見せたいのは、リワークを使ったかどうかで復職と再休職がどう違うか
export default function Analytics() {
  const yes = REWORK.yes;
  const no = REWORK.no;
  const yesAnswered = PERFORMANCE.yes.reduce((a, b) => a + b, 0);
  const noAnswered = PERFORMANCE.no.reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="hr-head">
        <div>
          <h1 className="hr-title">{ANALYTICS.title}</h1>
          <p className="muted an-sample">{ANALYTICS.sample}</p>
        </div>
      </div>

      <div className="an-tiles">
        <Tile label={ANALYTICS.returnRate} value={percent(RETURNED, PERIOD_PEOPLE)} unit="%" note={ANALYTICS.returnRateNote(PERIOD_PEOPLE)} />
        <Tile label={ANALYTICS.relapse} value={percent(RELAPSED_1Y, RETURNED)} unit="%" note={ANALYTICS.relapseNote(RETURNED)} />
        <Tile label={ANALYTICS.avgDays} value={AVG_LEAVE_DAYS} unit="日" note={ANALYTICS.avgDaysNote} />
        <Tile label={ANALYTICS.thisYear} value={THIS_YEAR} unit="人" note={ANALYTICS.thisYearNote} />
      </div>

      <div className="an-row">
        <section className="hr-card an-rework">
          <h2>{ANALYTICS.reworkTitle}</h2>
          <p className="muted">{ANALYTICS.reworkNote(yes.people, no.people)}</p>
          <h3>{ANALYTICS.returnRate}</h3>
          <Bar label={ANALYTICS.yes} value={percent(yes.returned, yes.people)} max={100} unit="%" detail={`${yes.returned}/${yes.people}人`} />
          <Bar label={ANALYTICS.no} value={percent(no.returned, no.people)} max={100} unit="%" detail={`${no.returned}/${no.people}人`} />
          <h3>{ANALYTICS.relapse}</h3>
          <Bar label={ANALYTICS.yes} value={percent(yes.relapsed, yes.returned)} max={100} unit="%" detail={`${yes.relapsed}/${yes.returned}人`} />
          <Bar label={ANALYTICS.no} value={percent(no.relapsed, no.returned)} max={100} unit="%" detail={`${no.relapsed}/${no.returned}人`} />
        </section>

        <section className="hr-card">
          <h2>{ANALYTICS.perfTitle}</h2>
          <p className="muted">{ANALYTICS.perfNote(yesAnswered + noAnswered)}</p>
          <Stack label={ANALYTICS.yes} counts={PERFORMANCE.yes} />
          <Stack label={ANALYTICS.no} counts={PERFORMANCE.no} />
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
function Bar({ label, value, max, unit, detail }: { label: string; value: number; max: number; unit: string; detail?: string }) {
  const tip = `${label}：${value}${unit}${detail ? `（${detail}）` : ""}`;
  return (
    <div className="an-bar" title={tip}>
      <span className="an-bar-label">{label}</span>
      <span className="an-track">
        <span className="an-fill" style={{ width: `${(value / max) * 100}%` }} />
      </span>
      <span className="an-bar-value">
        {value}
        {unit}
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
