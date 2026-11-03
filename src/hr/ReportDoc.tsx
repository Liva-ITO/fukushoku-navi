import { HR } from "../constants/labels";
import { ActivityChart } from "../person/SelfReportCard";
import type { SelfReport } from "../state/selfReport";

const jp = (d: string) => `${d.slice(0, 4)}年${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;
const md = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;

// 生活の記録のレポートを、書類の形で見せる。印刷やPDFでの保存は、ブラウザの印刷から
export default function ReportDoc({ r, name, dept, onClose }: { r: SelfReport; name: string; dept: string; onClose: () => void }) {
  const end = new Date(`${r.date}T00:00:00`);
  const start = new Date(end);
  start.setDate(end.getDate() - (r.period - 1));
  const D = HR.doc;

  return (
    <div className="modal-backdrop report-backdrop" role="dialog" aria-modal="true" aria-label={D.title}>
      <article className="report-doc">
        <header className="report-doc-head">
          <h1>{D.title}</h1>
          <dl className="report-doc-meta">
            <div>
              <dt>{D.name}</dt>
              <dd>{name}</dd>
            </div>
            <div>
              <dt>{D.dept}</dt>
              <dd>{dept}</dd>
            </div>
            <div>
              <dt>{D.submitted}</dt>
              <dd>{jp(r.date)}</dd>
            </div>
            <div>
              <dt>{D.period}</dt>
              <dd>{D.periodBody(md(start), md(end), r.days, r.period)}</dd>
            </div>
          </dl>
        </header>

        <section>
          <h2>{D.rhythm}</h2>
          <div className="report-doc-figures">
            <div>
              <p className="report-doc-label">{HR.rep.sleep}</p>
              <p className="report-doc-value">{r.bed ? `${r.sleepHours}時間` : "—"}</p>
              {r.bed && <p className="report-doc-sub">{D.sleepSub(r.bed, r.wake)}</p>}
            </div>
            <div>
              <p className="report-doc-label">{HR.rep.activity}</p>
              <p className="report-doc-value">{r.activityHours > 0 ? `${r.activityHours}時間` : "—"}</p>
              <p className="report-doc-sub">{D.activitySub}</p>
            </div>
            <div>
              <p className="report-doc-label">{HR.rep.out}</p>
              <p className="report-doc-value">{`${r.outDays}日`}</p>
              <p className="report-doc-sub">{D.outSub(r.outMinutes)}</p>
            </div>
          </div>
          <ActivityChart series={r.activitySeries} />
        </section>

        <section>
          <h2>{D.reflection}</h2>
          {[
            [HR.rep.condition, r.condition],
            [HR.rep.reason, r.reason],
            [HR.rep.measures, r.measures],
          ].map(([k, v]) => (
            <div key={k} className="report-doc-text">
              <h3>{k}</h3>
              <p>{v || "—"}</p>
            </div>
          ))}
        </section>

        <footer className="report-doc-foot">
          <p>{D.foot}</p>
          <div className="confirm-actions no-print">
            <button className="btn-outline" onClick={() => window.print()}>
              {D.print}
            </button>
            <button className="btn-quiet" onClick={onClose}>
              {D.close}
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}
