import { useState, type Dispatch } from "react";
import { HR, RECOVERY } from "../constants/labels";
import { DEMO_TODAY } from "../data/demo";
import { fromDiary, type SelfReport } from "../state/selfReport";
import type { Action, State } from "../state/store";

const L = RECOVERY.report;
const shortDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

// 会社に出すレポート（自分で準備する人）。睡眠と外出は日記から自動でまとめ、残りは本人が書く。
// 書く → 会社に届く内容を見る → 送る。送ったものだけが会社に届く
export function SelfReportCard({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const last = state.selfReports[state.selfReports.length - 1];
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [condition, setCondition] = useState(last?.condition ?? "");
  const [reason, setReason] = useState(last?.reason ?? "");
  const [measures, setMeasures] = useState(last?.measures ?? "");
  const auto = fromDiary(state.diary);
  const report = { ...auto, condition: condition.trim(), reason: reason.trim(), measures: measures.trim() };
  const filled = report.condition !== "" && report.reason !== "" && report.measures !== "";

  return (
    <div className="self-report" id="self-report">
      <p className="path-group">{L.title}</p>
      <p className="muted">{L.note}</p>
      {last && !open && <p className="done-note">{L.sent(shortDate(last.date))}</p>}
      {!open ? (
        <button className="btn-outline" onClick={() => setOpen(true)}>
          {last ? L.again : L.open}
        </button>
      ) : preview ? (
        <div className="preview">
          <p className="muted">{L.previewTitle}</p>
          <SelfReportView r={report} />
          <div className="confirm-actions">
            <button
              className="btn-primary"
              onClick={() => {
                dispatch({ type: "sendSelfReport", report: { ...report, date: DEMO_TODAY } });
                setPreview(false);
                setOpen(false);
              }}
            >
              {L.send}
            </button>
            <button className="btn-quiet" onClick={() => setPreview(false)}>
              {L.edit}
            </button>
          </div>
        </div>
      ) : (
        <div className="report-form">
          <p className="muted">{auto.days > 0 ? L.fromDiary(auto.period, auto.days) : L.noDiary}</p>
          <label className="field field-tight">
            {L.condition}
            <textarea rows={2} placeholder={L.conditionHint} value={condition} onChange={(e) => setCondition(e.target.value)} />
          </label>
          <label className="field field-tight">
            {L.reason}
            <textarea rows={2} placeholder={L.reasonHint} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <label className="field field-tight">
            {L.measures}
            <textarea rows={3} placeholder={L.measuresHint} value={measures} onChange={(e) => setMeasures(e.target.value)} />
          </label>
          <div className="confirm-actions">
            <button className="btn-primary" disabled={!filled} onClick={() => setPreview(true)}>
              {L.preview}
            </button>
            <button className="btn-quiet" onClick={() => setOpen(false)}>
              {L.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// レポートの中身（本人の確認と、人事の画面で同じ形で見せる）
export function SelfReportView({ r }: { r: Omit<SelfReport, "date"> }) {
  const rows: [string, string][] = [
    [HR.rep.period, HR.rep.periodBody(r.period, r.days)],
    [HR.rep.sleep, r.bed ? HR.rep.sleepBody(r.bed, r.wake, r.sleepHours) : "—"],
    [HR.rep.activity, HR.rep.activityBody(r.activityHours)],
    [HR.rep.out, HR.rep.outBody(r.outDays, r.outMinutes)],
    [HR.rep.condition, r.condition || "—"],
    [HR.rep.reason, r.reason || "—"],
    [HR.rep.measures, r.measures || "—"],
  ];
  return (
    <dl className="report-view">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>
            {v}
            {k === HR.rep.activity && <ActivityChart series={r.activitySeries} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// 日ごとの活動時間の棒グラフ。数字は文字でも出す（色だけに頼らない）
function ActivityChart({ series }: { series: SelfReport["activitySeries"] }) {
  if (!series?.length) return null;
  const max = 12;
  const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
  return (
    <figure className="act-chart">
      <figcaption className="muted">{HR.rep.activityChart}</figcaption>
      <div className="act-bars" role="img" aria-label={series.map((x) => `${md(x.date)} ${x.h ?? "—"}`).join("、")}>
        {series.map((x) => (
          <div key={x.date} className="act-col" title={`${md(x.date)}：${x.h === null ? "書いていない" : `${x.h}時間`}`}>
            <span className="act-val">{x.h ?? ""}</span>
            <span className="act-bar" style={{ height: `${((x.h ?? 0) / max) * 70}px` }} />
            <span className="act-day">{md(x.date).split("/")[1]}</span>
          </div>
        ))}
      </div>
      <p className="muted act-note">
        {md(series[0].date)}〜{md(series[series.length - 1].date)}（時間）。{HR.rep.activityChartNote}
      </p>
    </figure>
  );
}
