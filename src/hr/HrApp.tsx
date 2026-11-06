import { useEffect, useState, type Dispatch } from "react";
import { ACUTE, ANALYTICS, BOSS, HR, INVITE, RECOVERY, STAGE_LABELS, type Stage } from "../constants/labels";
import InviteForm from "./InviteForm";
import Accounts from "./Accounts";
import ReportDoc from "./ReportDoc";
import Analytics from "./Analytics";
import HistorySummary, { tlId } from "./HistorySummary";
import { SendHint } from "./SendHint";
import { daysSince } from "../data/demo";
import { currentBossId, slotLabel, whenOf, type Action, type HrAccount, type OccOpinion, type OfferKey, type Slot, type State } from "../state/store";
import { ConfirmButton } from "../person/parts";
import { END_NOTICE_DAYS, bossEvents, bossTodos, daysUntil, eventKey, hrRows, isIncoming, meetingsOf, seenKeysOf, sortTodos, type HrRow } from "./hrData";
import { DEMO_TODAY, PERSON, type HrEvent, type HrTodo } from "../data/demo";

type Props = { state: State; dispatch: Dispatch<Action> };

const STAGES: Stage[] = ["acute", "recovery", "preReturn", "afterReturn"];
const shortDate = (d: string) => d.replace(/-/g, "/");
const jpDate = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

// 会社（人事・産業保健）の画面。本人が提出したもの・やり取り・申し込みがあったことだけを表示する
export default function HrApp({ state, dispatch }: Props) {
  const rows = hrRows(state);
  // 復職済みの人も、休職期間中の記録を開いて見られる
  const selected = hrRows(state, true).find((r) => r.id === state.hrSelected);

  // 一覧と詳しい画面を切り替えたら、いちばん上から見せる
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.hrSelected, state.hrPage]);

  // 上司の画面：担当している人だけ
  if (state.hrRole === "boss")
    return (
      <div className="hr">
        <BossApp state={state} dispatch={dispatch} />
      </div>
    );
  if (selected)
    return (
      <div className="hr">
        <HrDetail row={selected} state={state} dispatch={dispatch} />
      </div>
    );
  return (
    <div className="hr">
      <nav className="hr-nav">
        {(state.hrRole === "admin" ? (["list", "analytics", "settings", "accounts"] as const) : (["list", "analytics"] as const)).map((p) => (
          <button
            key={p}
            aria-current={state.hrPage === p || (p === "list" && state.hrPage === "invite") ? "page" : undefined}
            onClick={() => dispatch({ type: "hrPage", page: p })}
          >
            {ANALYTICS.nav[p]}
          </button>
        ))}
      </nav>
      {state.hrPage === "analytics" ? (
        <Analytics />
      ) : state.hrPage === "settings" && state.hrRole === "admin" ? (
        <CompanySettings state={state} dispatch={dispatch} />
      ) : state.hrPage === "accounts" && state.hrRole === "admin" ? (
        <Accounts state={state} dispatch={dispatch} />
      ) : state.hrPage === "invite" ? (
        <InviteForm depts={state.depts} byBoss={state.contactBy === "boss"} dispatch={dispatch} />
      ) : (
        <HrList rows={rows} state={state} dispatch={dispatch} />
      )}
    </div>
  );
}

// 届いた日と、期限があれば「あと○日」を添える
function TodoText({ todo }: { todo: HrTodo }) {
  return (
    <span className="todo-text">
      {todo.text}
      <span className="todo-meta">
        {HR.received(shortDate(todo.date).slice(5))}
        {todo.due && <span className="todo-due">{HR.dueLeft(daysUntil(todo.due))}</span>}
      </span>
    </span>
  );
}

// 対応が必要なことの、対応する場所（詳しい画面の中の枠）
function todoTarget(key: string, live: boolean): string {
  if (key === "a-company") return "sec-meetings";
  if (key === "a-occ") return "sec-stage";
  if (key.startsWith("a-wish") || key === "a-psych-done") return "sec-stage";
  if (key.includes("-end-")) return live ? "sec-reg" : "sec-send";
  return "sec-send";
}
// 自分で「確認した」にするもの（それ以外は、対応すると自動で消える）
const manualTodo = (key: string) => !(key === "a-company" || key === "a-occ" || key.startsWith("a-wish") || key === "a-psych-done");

// 一覧の［対応する］から開いたとき、詳しい画面を開いたあとで移る場所
let pendingTarget: string | null = null;

// 対応する場所へ移り、少しのあいだ枠を目立たせる
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // なめらかに動かす指定は、環境によって動かないことがあるので、すぐに移る
  el.scrollIntoView({ block: "start" });
  el.classList.add("sec-flash");
  setTimeout(() => el.classList.remove("sec-flash"), 1600);
}

// 対応する場所に出す「ここで対応すること」。自分で確かめて終えるものだけ［確認した］を置く
function TodoHere({ row, section, dispatch }: { row: HrRow; section: string; dispatch: Dispatch<Action> }) {
  const here = row.todos.filter((t) => todoTarget(t.key, row.live) === section && manualTodo(t.key) && t.key !== REQUEST_KEY);
  if (here.length === 0) return null;
  return (
    <div className="todo-here">
      <p className="todo-here-title">{HR.todoHereTitle}</p>
      <ul className="list-plain">
        {here.map((t) => (
          <li key={t.key}>
            <p>{t.text}</p>
            <p className="muted">
              {/^[ab]-msg/.test(t.key) ? HR.todoAckNote.msg : t.key.includes("-end-") ? (row.live ? HR.todoAckNote.end : HR.todoAckNote.endOther) : HR.todoAckNote.other}
            </p>
            <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "hrMarkDone", key: t.key, personId: row.id, text: t.text })}>
              {HR.todoAck}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


// リクエストに人事ができるのは、チケットを補充することだけ（補充すると受け付けられる）
const REQUEST_KEY = "a-coord-req";

// チケットの補充は費用がかかるので、管理者だけ。スタッフには、管理者に頼むよう出す
function RefillButton({ label, state, dispatch }: { label: string } & Props) {
  if (state.hrRole !== "admin") return <span className="muted refill-admin">{HR.refillAdminOnly}</span>;
  return (
    <ConfirmButton
      quiet
      label={label}
      confirm={HR.refillConfirm}
      yes={HR.refillYes}
      no={HR.confirmNo}
      onConfirm={() => dispatch({ type: "refillTickets" })}
    />
  );
}

// 本人から届いたもののうち、開く前に見ていなかったものに「新着」の印をつける
function markNew(row: HrRow) {
  let n = 0;
  return row.events.map((e) => {
    if (!isIncoming(e)) return { e, isNew: false };
    n += 1;
    // 開く前に見ていたものを1件ずつ覚えていれば、それにないものが新着
    return { e, isNew: row.newFromKeys ? !row.newFromKeys.includes(eventKey(e)) : n > row.newFrom };
  });
}

// 詳しい画面を開くとき：いま届いているものを「見た」にし、開く前に見ていたものを新着の目印に残す
const selectRow = (r: HrRow): Action => ({
  type: "hrSelect",
  id: r.id,
  incoming: r.incoming,
  prevSeen: r.seen,
  keys: r.events.filter(isIncoming).map(eventKey),
  prevKeys: seenKeysOf(r),
});

function StageTag({ stage }: { stage: Stage }) {
  return <span className={`stage-tag stage-${stage}`}>{STAGE_LABELS[stage]}</span>;
}

function HrList({ rows: unsorted, state, dispatch }: { rows: HrRow[] } & Props) {
  // 見出しを押すと並び替え。もう一度押すと逆順
  const [sort, setSort] = useState<{ col: SortCol; asc: boolean } | null>(null);
  // 並び替えていないときは、対応が必要な人を上に
  const rows = sort
    ? sortRows(unsorted, sort.col, sort.asc)
    : unsorted.map((r, i) => ({ r, i })).sort((a, b) => b.r.todos.length - a.r.todos.length || a.i - b.i).map((x) => x.r);
  const th = (col: SortCol) => {
    const on = sort?.col === col;
    return (
      <th aria-sort={on ? (sort.asc ? "ascending" : "descending") : "none"}>
        <button className="th-sort" onClick={() => setSort({ col, asc: on ? !sort.asc : true })}>
          {HR.cols[col]}
          <span className="sort-mark">{on ? (sort.asc ? "▲" : "▼") : "↕"}</span>
        </button>
      </th>
    );
  };
  const todos = sortTodos(rows.flatMap((r) => r.todos.map((todo) => ({ row: r, todo }))));
  const open = (r: HrRow) => dispatch(selectRow(r));

  return (
    <>
      <div className="hr-head">
        <div>
          <h1 className="hr-title">{HR.title}</h1>
          <button className="btn-outline invite-open" onClick={() => dispatch({ type: "hrPage", page: "invite" })}>
            ＋ {INVITE.open}
          </button>
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <p className="tile-label">{HR.people}</p>
          <p className="tile-value">{HR.peopleUnit(rows.length)}</p>
        </div>
        <div className="tile tile-wide">
          <p className="tile-label">{HR.tickets}</p>
          <div className="tile-row">
            <p className="tile-value">{HR.ticketsUnit(state.ticketsLeft)}</p>
            <RefillButton label={HR.refill} state={state} dispatch={dispatch} />
          </div>
          <p className="muted">{HR.ticketsNote}</p>
        </div>
      </div>

      <section className="hr-card">
        <h2>{HR.todoTitle}</h2>
        {todos.length === 0 ? (
          <p className="muted">{HR.todoEmpty}</p>
        ) : (
          <ul className="todo-list">
            {todos.map(({ row, todo }) => (
              <li key={todo.key}>
                <span className="todo-name">{row.name}</span>
                <TodoText todo={todo} />
                {/* 一覧では「済み」にしない。押すと詳しい画面の、対応する場所へ移る */}
                <span className="todo-actions">
                  <button
                    className="btn-outline btn-small"
                    onClick={() => {
                      pendingTarget = todoTarget(todo.key, row.live);
                      open(row);
                    }}
                  >
                    {HR.todoGo} ›
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hr-card">
        <h2>{HR.listTitle}</h2>
        <div className="table-wrap">
        <table className="hr-table">
          <thead>
            <tr>
              {th("name")}
              {th("dept")}
              {th("stage")}
              {th("days")}
              {th("end")}
              {th("rework")}
              {th("news")}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => open(r)}>
                <td>
                  <button className="link-row">{r.name}</button>
                  {r.todos.length > 0 && <span className="todo-mark">{HR.todoMark(r.todos.length)}</span>}
                </td>
                <td>{r.dept}</td>
                <td>{r.pending ? <span className="stage-tag stage-pending">{INVITE.pendingTag}</span> : <StageTag stage={r.stage} />}</td>
                <td>{HR.days(daysSince(r.leaveStart))}</td>
                <td>
                  {shortDate(r.leaveEnd)}
                  {daysUntil(r.leaveEnd) >= 0 && (
                    <span className={`end-left${daysUntil(r.leaveEnd) <= END_NOTICE_DAYS ? " end-near" : ""}`}>
                      {HR.endLeft(daysUntil(r.leaveEnd))}
                    </span>
                  )}
                </td>
                <td>{r.rework}</td>
                <td>{r.news > 0 ? <span className="news">{HR.newsCount(r.news)}</span> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="muted table-note">{HR.sortHint}</p>
        <p className="muted table-note">{HR.newsNote}</p>
      </section>

      {state.stage === "afterReturn" && state.live && (
        <section className="hr-card">
          <h2>{HR.returnedTitle}</h2>
          <p className="muted">{HR.returnedNote}</p>
          <ul className="returned-list">
            <li className="returned-row" onClick={() => dispatch({ type: "hrSelect", id: PERSON.id })}>
              <button className="link-row">{state.live.name}</button>
              <span className="muted">{state.live.dept}</span>
              {state.returnPlan && <span>{HR.afterReturnDate(shortDate(state.returnPlan.date))}</span>}
              {state.returnPlan?.accommodation && <span>{HR.afterReturnAccommodation(state.returnPlan.accommodation)}</span>}
            </li>
          </ul>
        </section>
      )}

    </>
  );
}

type SortCol = keyof typeof HR.cols;

// 段階は流れの順（急性期→復職）、日数と新着は数で比べる
function sortRows(rows: HrRow[], col: SortCol, asc: boolean): HrRow[] {
  const key = (r: HrRow): string | number => {
    switch (col) {
      case "name":
        return r.name;
      case "dept":
        return r.dept;
      case "stage":
        return STAGES.indexOf(r.stage);
      case "days":
        return daysSince(r.leaveStart);
      case "end":
        return r.leaveEnd;
      case "rework":
        return r.rework;
      case "news":
        return r.news;
    }
  };
  return [...rows].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ja");
    return asc ? c : -c;
  });
}

// 経緯が10件を超えたら、前の経緯を出すボタンを置く
function MoreButton({ total, shown, onMore }: { total: number; shown: number; onMore: () => void }) {
  if (total <= shown) return null;
  return (
    <button className="btn-quiet btn-small tl-more" onClick={onMore}>
      {HR.historyMore(total - shown)}
    </button>
  );
}

function HrDetail({ row, state, dispatch }: { row: HrRow } & Props) {
  const [shown, setShown] = useState<number>(HR.historyPage);
  // 一覧の［対応する］から来たときは、対応する場所まで移る（画面の切り替えでいちばん上に戻したあとに）
  useEffect(() => {
    if (!pendingTarget) return;
    // 移ってから消す（開発中は効果が2回走るので、先に消すと移れない）
    const t = setTimeout(() => {
      if (pendingTarget) goTo(pendingTarget);
      pendingTarget = null;
    }, 150);
    return () => clearTimeout(t);
  }, []);
  const openReport = row.live && state.hrReport !== null ? state.selfReports[state.hrReport] : undefined;
  // 開く前に見ていなかったもの。経緯の中だけだと埋もれるので、いちばん上にも出す
  const newItems = markNew(row).filter((x) => x.isNew).reverse();
  return (
    <>
      {openReport && (
        <ReportDoc r={openReport} name={row.name} dept={row.dept} onClose={() => dispatch({ type: "openReport", index: null })} />
      )}
      <BackButton dispatch={dispatch} />
      <div className="hr-head">
        <h1 className="hr-title">
          {row.name}　<span className="muted">{row.dept}</span>
        </h1>
        <StageTag stage={row.stage} />
      </div>
      {row.stage !== "afterReturn" && (
        <p className="hr-period">
          {HR.periodSince(daysSince(row.leaveStart))}　{HR.periodEnd(shortDate(row.leaveEnd))}
          {daysUntil(row.leaveEnd) >= 0 && (
            <span className={`end-left${daysUntil(row.leaveEnd) <= END_NOTICE_DAYS ? " end-near" : ""}`}>
              {HR.endLeft(daysUntil(row.leaveEnd))}
            </span>
          )}
        </p>
      )}

      {newItems.length > 0 && (
        <section className="hr-card hr-card-new">
          <h2>
            {HR.newTitle}
            <span className="new-tag">{HR.newsCount(newItems.length)}</span>
          </h2>
          <ul className="new-list">
            {newItems.map(({ e }, i) => (
              <li key={i}>
                <span className="tl-date">{shortDate(e.date)}</span>
                <span className="tl-kind">
                  {HR.event[e.kind as "fromPerson" | "submit" | "meeting"]}
                  <EventTags e={e} />
                </span>
                <span className="tl-body">{e.body}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {row.todos.length > 0 && (
        <section className="hr-card hr-card-todo">
          <h2>{HR.todoTitle}</h2>
          <ul className="todo-list">
            {sortTodos(row.todos.map((todo) => ({ todo }))).map(({ todo }) => (
              <li key={todo.key} className="todo-detail">
                <TodoText todo={todo} />
                {todo.key === REQUEST_KEY ? (
                  <RefillButton label={HR.refillTodo} state={state} dispatch={dispatch} />
                ) : (
                  <button className="btn-outline btn-small" onClick={() => goTo(todoTarget(todo.key, row.live))}>
                    {HR.todoGo} ›
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="hr-columns">
        <section className="hr-card">
          <h2>{HR.historyTitle}</h2>
          <p className="muted">{HR.historyNote}</p>
          <p className="muted">{HR.privateNote}</p>
          <HistorySummary events={row.events} audience="hr" rowId={row.id} reveal={(n) => setShown((s) => Math.max(s, n))} />
          <ol className="timeline">
            {markNew(row).reverse().slice(0, shown).map(({ e, isNew }, i) => (
              <li key={i} id={tlId("hr", row.events.length - 1 - i)} className={`tl tl-${e.kind}${isNew ? " tl-new" : ""}`}>
                <span className="tl-date">{shortDate(e.date)}</span>
                <span className="tl-kind">
                  {e.kind === "stage" ? HR.event.stage(e.body) : e.kind === "fromHr" && e.by ? BOSS.fromBoss : HR.event[e.kind]}
                  {isNew && <span className="new-tag">{HR.newTag}</span>}
                  <EventTags e={e} />
                </span>
                {e.kind !== "stage" &&
                  (e.report !== undefined ? (
                    <button className="tl-body link-row tl-link" onClick={() => dispatch({ type: "openReport", index: e.report ?? null })}>
                      {e.body} ›
                    </button>
                  ) : (
                    <span className="tl-body">{e.body}</span>
                  ))}
              </li>
            ))}
          </ol>
          <MoreButton total={row.events.length} shown={shown} onMore={() => setShown((s) => s + HR.historyPage)} />
          <p className="muted hidden-note">{HR.hidden}</p>
        </section>

        <div>
          <section className="hr-card" id="sec-stage">
            <h2>
              {HR.stageTitle}　<StageTag stage={row.stage} />
            </h2>
            <p className="muted stage-guide">{HR.stageGuide[row.stage]}</p>
            {row.live && row.stage === "afterReturn" ? (
              <p className="muted">{HR.returnedReadOnly}</p>
            ) : row.live ? (
              <StageControl row={row} state={state} dispatch={dispatch} />
            ) : (
              <>
                <p className="muted">{row.pending ? INVITE.pendingNote : HR.stageDemoOnly}</p>
                {row.invite && <InviteResend key={row.id} id={row.id} invite={row.invite} dispatch={dispatch} />}
              </>
            )}
          </section>

          {row.live && row.stage !== "afterReturn" && <Meetings state={state} dispatch={dispatch} />}
          {(row.live || row.pending) && <RegistrationCard row={row} state={state} dispatch={dispatch} />}
          <IssuesCard row={row} state={state} dispatch={dispatch} />
          {!row.pending && row.stage !== "afterReturn" && (
            <SendMessage
              key={row.id}
              personId={row.id}
              name={row.name}
              stage={row.stage}
              occDate={row.live && state.occMeeting?.status === "scheduled" ? jpDate(state.occMeeting.date) : null}
              row={row}
              dispatch={dispatch}
            />
          )}
        </div>
      </div>

      {/* 下まで読んだあと、上まで戻らずに一覧へ */}
      <BackButton dispatch={dispatch} bottom />
    </>
  );
}

// 面談の状態と、「返信は不要です」をつけたか
function EventTags({ e }: { e: HrEvent }) {
  return (
    <>
      {e.status && <span className="status-tag">{e.status}</span>}
      {e.noReply && <span className="status-tag">{HR.noReplyTag}</span>}
    </>
  );
}

// 面談の状態。会社との面談は人事が日程と実施を記録し、コーディネーターとの面談は支援機関からの報告で変わる
function Meetings({ state, dispatch }: Props) {
  const list = meetingsOf(state);
  if (list.length === 0) return null;
  const c = state.companyMeeting;
  // 支援機関の報告：日程の候補を送った → （本人が選ぶ）→ 実施した。リクエストは、難しいと連絡することもある
  const coordOpen = state.coordinatorMeeting !== null && state.coordinatorReport === null;
  const cs = state.coordSchedule;

  return (
    <section className="hr-card" id="sec-meetings">
      <h2>{HR.meetingTitle}</h2>
      <ul className="meeting-list">
        {list.map((m) => (
          <li key={m.key}>
            <span>{m.name}</span>
            <span className="status-tag">{m.status}</span>
          </li>
        ))}
      </ul>

      {c?.status === "applied" && <OfferSlots offerKey="company" state={state} dispatch={dispatch} />}
      {c?.status === "scheduled" && c.date && state.live && (
        <OccNotify name={state.live.name} date={c.date} time={c.time} state={state} dispatch={dispatch} company />
      )}
      {c?.status === "scheduled" && (
        <div className="meeting-action">
          <button className="btn-outline btn-small" onClick={() => dispatch({ type: "finishCompanyMeeting" })}>
            {HR.companyDone}
          </button>
          <button
            className="btn-quiet btn-small"
            onClick={() => dispatch({ type: "rescheduleCompanyMeeting" })}
          >
            {HR.reschedule}
          </button>
        </div>
      )}

      {coordOpen && (
        <div className="meeting-action demo-report">
          <span className="muted">{HR.demoReport}</span>
          {cs?.chosen ? (
            <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "coordinatorReport", report: "done" })}>
              {HR.reportDone}
            </button>
          ) : cs ? (
            <span className="muted">{HR.waitingPick}</span>
          ) : (
            <>
              <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "offerSlots", kind: "coordinator" })}>
                {HR.reportScheduled}
              </button>
              {state.coordinatorMeeting === "requested" && (
                <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "coordinatorReport", report: "declined" })}>
                  {HR.reportDeclined}
                </button>
              )}
            </>
          )}
        </div>
      )}
      <p className="muted">{HR.meetingNote}</p>
    </section>
  );
}

// 準備期：復職までの手順。順番は会社の設定で並べ替えるだけで、どこからでも押せる
function ReturnSteps({ row, state, dispatch }: { row: HrRow } & Props) {
  const [planDate, setPlanDate] = useState(state.returnPlan?.date ?? "");
  const [accommodation, setAccommodation] = useState(state.returnPlan?.accommodation ?? "");
  const occ = state.occMeeting;
  const plan = state.returnPlan;
  const [editing, setEditing] = useState(!state.returnPlan);
  // 本人から届いた配慮のお願い（いちばん新しいもの）
  const accRequest = [...state.sentToHr].reverse().find((s) => s.kind === "accommodation");
  // 産業医の意見に書いた配慮を、配慮の欄に最初から入れておく（書き直せる）
  const opinionNote = occ?.opinion?.note ?? "";
  useEffect(() => {
    if (opinionNote) setAccommodation((a) => a || opinionNote);
  }, [opinionNote]);
  // 復職日を書き直している間は、確定できない
  const ready = occ?.status === "done" && state.returnDecision === "ok" && state.doctorNote && plan !== null && !editing;

  const Status = ({ done }: { done: boolean }) => (
    <span className={`status-tag${done ? " status-done" : ""}`}>{done ? HR.stepDone : HR.stepNotYet}</span>
  );

  const occStep = (
    <li key="occ">
      <p className="step-title">
        {HR.stepOcc}
        {occ?.status === "scheduled" ? (
          <span className="status-tag">{HR.meetingStatus.scheduled(shortDate(occ.date).slice(5))}</span>
        ) : (
          <Status done={occ?.status === "done"} />
        )}
      </p>
      <p className="muted">{HR.stepOccNote}</p>
      <OccMaterial state={state} dispatch={dispatch} />
      <IssuesRef row={row} />
      {!occ && (state.occApplied ? <OfferSlots offerKey="occ" state={state} dispatch={dispatch} /> : <p className="muted">{HR.offer.waitApply}</p>)}
      {occ?.status === "scheduled" && <OccNotify name={row.name} date={occ.date} time={occ.time} state={state} dispatch={dispatch} />}
      {occ?.status === "scheduled" && (
        <div className="meeting-action">
          <OccDone dispatch={dispatch} />
          <button
            className="btn-quiet btn-small"
            onClick={() => dispatch({ type: "rescheduleOccMeeting" })}
          >
            {HR.reschedule}
          </button>
        </div>
      )}
      {occ?.status === "done" && (
        <div className="meeting-action">
          <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "undoOccMeetingDone" })}>
            {HR.undoDone}
          </button>
        </div>
      )}
    </li>
  );

  const doctorStep = (
    <li key="doctor">
      <p className="step-title">
        {HR.stepDoctor}
        <Status done={state.doctorNote} />
      </p>
      <div className="meeting-action">
        {state.doctorNote ? (
          <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "undoDoctorNote" })}>
            {HR.undoReceived}
          </button>
        ) : (
          <button className="btn-outline btn-small" onClick={() => dispatch({ type: "receiveDoctorNote" })}>
            {HR.doctorReceived}
          </button>
        )}
      </div>
    </li>
  );

  // 会社の判断は人事が操作する。産業医との面談が済むまでは押せない
  const decided = state.returnDecision === "ok";
  const decisionStep = (
    <li key="decision">
      <p className="step-title">
        {HR.stepDecision}
        <Status done={decided} />
      </p>
      <p className="muted">{HR.stepDecisionNote}</p>
      {occ?.status === "done" && (
        <p className="opinion-line">
          {occ.opinion ? HR.opinion.line(HR.opinion.options[occ.opinion.verdict], occ.opinion.note) : HR.opinion.none}
        </p>
      )}
      <IssuesRef row={row} />
      {decided ? (
        <div className="meeting-action">
          <span>{HR.decisionResult.ok}</span>
          <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "undoReturnDecision" })}>
            {HR.decisionUndo}
          </button>
        </div>
      ) : occ?.status === "done" ? (
        <div className="decision-actions">
          <ConfirmButton
            quiet
            label={HR.decisionOk}
            confirm={HR.decisionOkConfirm(row.name)}
            yes={HR.decisionYes}
            no={HR.confirmNo}
            onConfirm={() => dispatch({ type: "decideReturn", result: "ok" })}
          />
          <ConfirmButton
            quiet
            label={HR.decisionNotYet}
            confirm={HR.decisionNotYetConfirm(row.name)}
            yes={HR.decisionYes}
            no={HR.confirmNo}
            onConfirm={() => dispatch({ type: "decideReturn", result: "notYet" })}
          />
        </div>
      ) : (
        <p className="muted">{HR.decisionLocked}</p>
      )}
    </li>
  );

  const planStep = (
    <li key="plan">
      <p className="step-title">
        {HR.stepPlan}
        <Status done={plan !== null && !editing} />
      </p>
      {accRequest && <p className="opinion-line">{HR.accFromPerson(accRequest.body)}</p>}
      {editing ? (
        <div className="plan-form">
          <label className="muted">
            {HR.returnDate}
            <input type="date" min={DEMO_TODAY} value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
          </label>
          {planDate && planDate > row.leaveEnd && <p className="field-warn">{HR.returnAfterEnd(shortDate(row.leaveEnd))}</p>}
          <label className="muted">
            {HR.accommodation}
            <textarea
              className="hr-textarea"
              rows={2}
              placeholder={HR.accommodationExample}
              value={accommodation}
              onChange={(e) => setAccommodation(e.target.value)}
            />
          </label>
          <button
            className="btn-outline btn-small"
            disabled={!planDate}
            onClick={() => {
              dispatch({ type: "setReturnPlan", date: planDate, accommodation: accommodation.trim() });
              setEditing(false);
            }}
          >
            {HR.savePlan}
          </button>
        </div>
      ) : (
        plan && (
          <div className="return-info">
            <p>{HR.afterReturnDate(shortDate(plan.date))}</p>
            {plan.date > row.leaveEnd && <p className="field-warn">{HR.returnAfterEnd(shortDate(row.leaveEnd))}</p>}
            {plan.accommodation && <p>{HR.afterReturnAccommodation(plan.accommodation)}</p>}
            <button className="btn-outline btn-small" onClick={() => setEditing(true)}>
              {HR.editPlan}
            </button>
          </div>
        )
      )}
    </li>
  );

  return (
    <div className="return-steps">
      <h3>{HR.returnTitle}</h3>
      <p className="muted return-order-now">{HR.returnOrderNow(HR.returnOrders[state.returnOrder])}</p>
      <p className="muted return-order-now">{HR.returnOrderNote[state.returnOrder]}</p>

      <ol className="step-list">
        {state.returnOrder === "occFirst" ? [occStep, decisionStep, doctorStep] : [doctorStep, occStep, decisionStep]}
        {planStep}
      </ol>

      {ready && plan ? (
        <ConfirmButton
          label={HR.confirmReturnLabel}
          confirm={HR.confirmReturn(row.name, shortDate(plan.date))}
          yes={HR.confirmReturnYes}
          no={HR.confirmNo}
          onConfirm={() => dispatch({ type: "confirmReturn" })}
        />
      ) : (
        <>
          <button className="btn-primary" disabled>
            {HR.confirmReturnLabel}
          </button>
          <p className="muted">{HR.confirmReturnLocked}</p>
        </>
      )}
    </div>
  );
}

// 会社として最初に一度決めること。人ごとには選ばない
// 部署の一覧。登録ではここから選ぶ
function DeptSetting({ depts, onChange }: { depts: string[]; onChange: (d: string[]) => void }) {
  const [name, setName] = useState("");
  const n = name.trim();
  const dup = depts.includes(n);
  return (
    <fieldset className="setting">
      <legend>{HR.deptLabel}</legend>
      <ul className="dept-list">
        {depts.map((d) => (
          <li key={d}>
            {d}
            <button className="btn-quiet btn-small" onClick={() => onChange(depts.filter((x) => x !== d))}>
              {HR.deptRemove}
            </button>
          </li>
        ))}
      </ul>
      <div className="setting-row">
        <input className="hr-input" placeholder={HR.deptAddPlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
        <button
          className="btn-outline btn-small"
          disabled={!n || dup}
          onClick={() => {
            onChange([...depts, n]);
            setName("");
          }}
        >
          {HR.deptAdd}
        </button>
      </div>
      {dup && <p className="muted">{HR.deptExists}</p>}
      <p className="muted">{HR.deptNote}</p>
    </fieldset>
  );
}

function CompanySettings({ state, dispatch }: Props) {
  const set = (patch: Parameters<typeof setCompany>[0]) => dispatch(setCompany(patch));
  return (
    <section className="hr-card settings">
      <h1 className="hr-title">{HR.settingsTitle}</h1>
      <p className="muted">{HR.settingsNote}</p>
      <p className="muted">{HR.settingsDemoNote}</p>

      <DeptSetting depts={state.depts} onChange={(depts) => set({ depts })} />

      <fieldset className="setting">
        <legend>{BOSS.settingTitle}</legend>
        <div className="setting-row">
          <label className="check">
            <input type="radio" name="contactBy" checked={state.contactBy === "hr"} onChange={() => set({ contactBy: "hr" })} />
            {BOSS.settingHr}
          </label>
          <label className="check">
            <input type="radio" name="contactBy" checked={state.contactBy === "boss"} onChange={() => set({ contactBy: "boss" })} />
            {BOSS.settingBoss}
          </label>
        </div>
        <p className="muted">{BOSS.settingNote}</p>
      </fieldset>

      <fieldset className="setting">
        <legend>{HR.maxLeaveLabel}</legend>
        <select className="hr-input" value={state.maxLeave} onChange={(e) => set({ maxLeave: e.target.value })}>
          {HR.maxLeaveOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <p className="muted">{HR.maxLeaveNote}</p>
      </fieldset>

      <fieldset className="setting">
        <legend>{HR.sickLeaveLabel}</legend>
        <div className="setting-row">
          <label className="check">
            <input type="radio" name="sick" checked={state.sickLeave} onChange={() => set({ sickLeave: true })} />
            {HR.sickLeaveYes}
          </label>
          <label className="check">
            <input type="radio" name="sick" checked={!state.sickLeave} onChange={() => set({ sickLeave: false })} />
            {HR.sickLeaveNo}
          </label>
          {state.sickLeave && (
            <label className="check">
              {HR.sickLeaveDays}
              <input
                className="hr-input setting-days"
                type="number"
                min={1}
                value={state.sickLeaveDays}
                onChange={(e) => set({ sickLeaveDays: Number(e.target.value) })}
              />
              {HR.sickLeaveDaysUnit}
            </label>
          )}
        </div>
        <p className="muted">{HR.sickLeaveNote}</p>
      </fieldset>

      <fieldset className="setting">
        <legend>{HR.prepCondTitle}</legend>
        <label className="check">
          <input
            type="checkbox"
            checked={state.prepConds.attendance}
            onChange={(e) => set({ prepConds: { ...state.prepConds, attendance: e.target.checked } })}
          />
          {HR.prepCond.attendance(state.prepConds.attendanceRate)}
        </label>
        {state.prepConds.attendance && (
          <label className="check setting-indent">
            {HR.prepCondRate}
            <input
              className="hr-input setting-days"
              type="number"
              min={1}
              max={100}
              value={state.prepConds.attendanceRate}
              onChange={(e) => set({ prepConds: { ...state.prepConds, attendanceRate: Number(e.target.value) } })}
            />
            %
          </label>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={state.prepConds.selfCheck}
            onChange={(e) => set({ prepConds: { ...state.prepConds, selfCheck: e.target.checked } })}
          />
          {HR.prepCond.selfCheck}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={state.prepConds.companyMeeting}
            onChange={(e) => set({ prepConds: { ...state.prepConds, companyMeeting: e.target.checked } })}
          />
          {HR.prepCond.companyMeeting}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={state.prepConds.selfReport}
            onChange={(e) => set({ prepConds: { ...state.prepConds, selfReport: e.target.checked } })}
          />
          {HR.prepCond.selfReport}
        </label>
        <p className="muted">{HR.prepCondNote}</p>
      </fieldset>

      <fieldset className="setting">
        <legend>{HR.rehabLabel}</legend>
        <div className="setting-row">
          <label className="check">
            <input type="radio" name="rehab" checked={state.rehab} onChange={() => set({ rehab: true })} />
            {HR.rehabYes}
          </label>
          <label className="check">
            <input type="radio" name="rehab" checked={!state.rehab} onChange={() => set({ rehab: false })} />
            {HR.rehabNo}
          </label>
        </div>
        <p className="muted">{HR.rehabNote}</p>
      </fieldset>

      <fieldset className="setting">
        <legend>{HR.returnOrderLabel}</legend>
        {(["occFirst", "doctorFirst"] as const).map((o) => (
          <label key={o} className="check">
            <input type="radio" name="return-order" checked={state.returnOrder === o} onChange={() => dispatch({ type: "setReturnOrder", order: o })} />
            {HR.returnOrders[o]}
          </label>
        ))}
        <p className="muted">{HR.returnOrderNote[state.returnOrder]}</p>
      </fieldset>

      <p className="muted">{HR.settingsMore}</p>
    </section>
  );
}

const setCompany = (patch: Extract<Action, { type: "setCompany" }>["patch"]): Action => ({ type: "setCompany", patch });

// 登録のときに入力した、復職に向けた課題（会社の見立て）
// まだ始めていない人：いつ・どこへ案内を送ったかを出し、送り直せるようにする
function InviteResend({ id, invite, dispatch }: { id: string; invite: NonNullable<HrRow["invite"]>; dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(invite.email);
  const md = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;
  const last = invite.resends[invite.resends.length - 1] ?? { date: invite.date, email: invite.email };
  return (
    <div className="invite-resend">
      <p>{INVITE.sentTo(md(last.date), last.email)}</p>
      {open ? (
        <div className="issues-add">
          <label className="hr-field">
            {INVITE.email}
            <input className="hr-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="confirm-actions">
            <button
              className="btn-primary btn-small"
              disabled={!/.+@.+\..+/.test(email.trim())}
              onClick={() => {
                dispatch({ type: "resendInvite", id, email: email.trim() });
                setOpen(false);
              }}
            >
              {INVITE.resendSave}
            </button>
            <button className="btn-quiet btn-small" onClick={() => setOpen(false)}>
              {INVITE.resendCancel}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="muted">{INVITE.resendNote}</p>
          <button className="btn-outline btn-small" onClick={() => setOpen(true)}>
            {INVITE.resend}
          </button>
        </>
      )}
    </div>
  );
}

// 登録内容（スタッフも直せる）。直したことは「登録の変更」として経緯に残す
function RegistrationCard({ row, state, dispatch }: { row: HrRow } & Props) {
  const src = row.id === PERSON.id ? state.live : state.invited.find((p) => p.id === row.id);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(src ?? null);
  const byBoss = state.contactBy === "boss";
  const boss = state.hrAccounts.find((a) => a.id === src?.bossId);
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  if (!src || !draft) return null;
  const bossTouched = byBoss && (bName.trim() !== (boss?.name ?? "") || bEmail.trim().toLowerCase() !== (boss?.email ?? "").toLowerCase());
  const bossInvalid = bossTouched && (!bName.trim() || !/.+@.+\..+/.test(bEmail.trim()));
  const bossChanged = bossTouched && !bossInvalid;
  const F = INVITE.regField;
  const keys = ["name", "dept", "leaveStart", "leaveEnd", "email"] as const;
  const show = (k: (typeof keys)[number], v: string) => (k === "leaveStart" || k === "leaveEnd" ? shortDate(v) : v);
  const changes = keys.filter((k) => draft[k].trim() !== src[k]);
  const endInvalid = draft.leaveEnd <= draft.leaveStart;
  const emailInvalid = !/.+@.+\..+/.test(draft.email.trim());

  return (
    <section className="hr-card" id="sec-reg">
      <h2>{INVITE.regTitle}</h2>
      <TodoHere row={row} section="sec-reg" dispatch={dispatch} />
      {!open ? (
        <>
          <dl className="reg-list">
            {keys.map((k) => (
              <div key={k}>
                <dt>{F[k]}</dt>
                <dd>{show(k, src[k]) || "—"}</dd>
              </div>
            ))}
            {byBoss && (
              <div>
                <dt>{BOSS.regLabel}</dt>
                <dd>{boss ? (boss.email ? `${boss.name}（${boss.email}）` : boss.name) : BOSS.regNone}</dd>
              </div>
            )}
          </dl>
          {row.stage !== "afterReturn" && (
            <button
              className="btn-outline btn-small"
              onClick={() => {
                setDraft(src);
                setBName(boss?.name ?? "");
                setBEmail(boss?.email ?? "");
                setOpen(true);
              }}
            >
              {INVITE.regEdit}
            </button>
          )}
        </>
      ) : (
        <div className="issues-add">
          <label className="hr-field">
            {F.name}
            <input className="hr-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="hr-field">
            {F.dept}
            <select className="hr-input" value={draft.dept} onChange={(e) => setDraft({ ...draft, dept: e.target.value })}>
              {[...new Set([draft.dept, ...state.depts])].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="hr-field">
            {F.leaveStart}
            <input className="hr-input" type="date" value={draft.leaveStart} onChange={(e) => setDraft({ ...draft, leaveStart: e.target.value })} />
          </label>
          <label className="hr-field">
            {F.leaveEnd}
            <input className="hr-input" type="date" min={draft.leaveStart} value={draft.leaveEnd} onChange={(e) => setDraft({ ...draft, leaveEnd: e.target.value })} />
            {endInvalid && <span className="field-error">{INVITE.leaveEndInvalid}</span>}
          </label>
          <label className="hr-field">
            {F.email}
            <input className="hr-input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </label>
          {byBoss && (
            <>
              <label className="hr-field">
                {BOSS.name}
                <input className="hr-input" value={bName} onChange={(e) => setBName(e.target.value)} />
              </label>
              <label className="hr-field">
                {BOSS.email}
                <input className="hr-input" type="email" value={bEmail} onChange={(e) => setBEmail(e.target.value)} />
                {bossInvalid && <span className="field-error">{BOSS.email}</span>}
              </label>
              <p className="muted">{BOSS.regNote}</p>
            </>
          )}
          <p className="muted">{INVITE.regNote}</p>
          <div className="confirm-actions">
            <button
              className="btn-primary btn-small"
              disabled={(changes.length === 0 && !bossChanged) || endInvalid || emailInvalid || bossInvalid || !draft.name.trim()}
              onClick={() => {
                const patch = Object.fromEntries(changes.map((k) => [k, draft[k].trim()]));
                const list = changes.map((k) => INVITE.regChange(F[k], show(k, src[k]), show(k, draft[k].trim())));
                if (bossChanged) list.push(BOSS.regChange(boss?.name ?? BOSS.regNone, bName.trim()));
                const text = INVITE.regEvent(list);
                dispatch({
                  type: "editRegistration",
                  personId: row.id,
                  patch,
                  text,
                  boss: bossChanged ? { name: bName.trim(), email: bEmail.trim() } : undefined,
                });
                setOpen(false);
              }}
            >
              {INVITE.regSave}
            </button>
            <button className="btn-quiet btn-small" onClick={() => setOpen(false)}>
              {INVITE.regCancel}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// リワークのスタッフへの共有。本人の同意があるときだけ。共有そのものは、会社とリワークのあいだで行う
function ShareConsent({ state, dispatch }: Props) {
  const c = state.shareConsent;
  return (
    <div className="share-box">
      <p className="share-title">{INVITE.shareTitle}</p>
      <p>{c === null ? INVITE.shareNone : c ? INVITE.shareYes : INVITE.shareNo}</p>
      {c && (state.sharedDate ? (
        <p className="done-note">{INVITE.shareDone(state.sharedDate.slice(5).replace("-", "/"))}</p>
      ) : (
        <>
          <p className="muted">{INVITE.shareHow}</p>
          <button className="btn-outline btn-small" onClick={() => dispatch({ type: "recordShared" })}>
            {INVITE.shareRecord}
          </button>
        </>
      ))}
    </div>
  );
}

function IssuesCard({ row, state, dispatch }: { row: HrRow; state: State; dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <section className="hr-card">
      <h2>{INVITE.issuesTitle}</h2>
      <IssuesBody row={row} />
      {row.live && row.rework_ && <ShareConsent state={state} dispatch={dispatch} />}
      {row.stage !== "afterReturn" &&
        (open ? (
          <div className="issues-add">
            <label className="hr-field">
              {INVITE.issuesAddLabel}
              <textarea
                className="hr-textarea"
                rows={2}
                placeholder={INVITE.issuesAddExample}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <p className="muted">{INVITE.issuesAddNote}</p>
            <div className="confirm-actions">
              <button
                className="btn-primary btn-small"
                disabled={!text.trim()}
                onClick={() => {
                  dispatch({ type: "addIssueNote", personId: row.id, text: text.trim() });
                  setText("");
                  setOpen(false);
                }}
              >
                {INVITE.issuesAddSave}
              </button>
              <button className="btn-quiet btn-small" onClick={() => setOpen(false)}>
                {INVITE.issuesAddCancel}
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-outline btn-small" onClick={() => setOpen(true)}>
            {INVITE.issuesAdd}
          </button>
        ))}
    </section>
  );
}

// 登録時の見立てと、あとからの追記を、日付順に並べる
function IssuesBody({ row }: { row: HrRow }) {
  return (
    <div className="issues-list">
      <div>
        <p className="issues-head">{INVITE.issuesFirst}</p>
        <p className="issues-body">{row.issues || INVITE.issuesNone}</p>
      </div>
      {row.issueNotes.map((n, i) => (
        <div key={i}>
          <p className="issues-head">{INVITE.issuesNoteHead(n.date.slice(5).replace("-", "/"))}</p>
          <p className="issues-body">{n.text}</p>
        </div>
      ))}
    </div>
  );
}

// 産業医との面談・会社の復職判断のところで、その場で見返せるようにする
// 自分で準備する人のレポート。いちばん新しいものを、たたんで出す。デモでは届いたことにできる
function SelfReportRef({ state, dispatch }: Props) {
  const last = state.selfReports[state.selfReports.length - 1];
  return (
    <>
      {last ? (
        <button className="btn-outline btn-small" onClick={() => dispatch({ type: "openReport", index: state.selfReports.length - 1 })}>
          {HR.selfReportView}（{last.date.slice(5).replace("-", "/")}） ›
        </button>
      ) : (
        <p className="muted">{HR.selfReportNone}</p>
      )}
      <div className="meeting-action demo-report">
        <span className="muted">{HR.demoFromPerson}</span>
        <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "demoSelfReport" })}>
          {HR.selfReportArrive}
        </button>
      </div>
    </>
  );
}

// 産業医との面談の材料：自分で準備する人はレポート、リワークの人は月次レポート
function OccMaterial({ state, dispatch }: Props) {
  if (state.prepPath === "self")
    return (
      <div className="occ-material">
        <p className="occ-material-title">{HR.occMaterial}：{HR.occMaterialSelf}</p>
        <SelfReportRef state={state} dispatch={dispatch} />
      </div>
    );
  const last = state.reworkReports[state.reworkReports.length - 1];
  return (
    <div className="occ-material">
      <p className="occ-material-title">{HR.occMaterial}：{HR.occMaterialRework}</p>
      <p className="muted">{last ? HR.reportBody(last.month, last.days, last.rate) : HR.occMaterialNone}</p>
      <div className="meeting-action demo-report">
        <span className="muted">{HR.demoReport}</span>
        <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "reworkReport" })}>
          {HR.reportArrive}
        </button>
      </div>
    </div>
  );
}

// 産業医との面談の日を、本人に知らせる（例文を確かめてから送る）。本人の「連絡」タブに届く
function OccNotify({ date, time, state, company = false }: { name: string; date: string; time?: string; company?: boolean } & Props) {
  // 日を決めると、本人の「連絡」に日程のお知らせが自動で届く。ここでは届いたことだけを出す
  const t = company ? HR.companyNotifyTemplate(whenOf(date, time)) : HR.templatesPreReturn(whenOf(date, time))[0];
  const done = state.hrMessages.some((m) => m.title === t.title && m.body === t.text);
  return done ? <p className="done-note">{HR.occNotified}</p> : null;
}

// 面談の日程の候補を3つまで送る。本人が「連絡」で選ぶと、日程が決まる。どれも難しいときは、送り直す
function OfferSlots({ offerKey, state, dispatch }: { offerKey: OfferKey } & Props) {
  const L = HR.offer;
  const empty: Slot = { date: "", time: L.times[3] };
  const [slots, setSlots] = useState<Slot[]>([empty, empty, empty]);
  const offer = state.offers[offerKey];
  const ready = slots.filter((s) => s.date !== "");
  const set = (i: number, s: Partial<Slot>) => setSlots(slots.map((x, j) => (j === i ? { ...x, ...s } : x)));

  if (offer && !offer.declined)
    return (
      <div className="offer-box">
        <p className="done-note">{L.sent}</p>
        <ul className="list-dot">
          {offer.slots.map((s) => (
            <li key={s.date + s.time}>{slotLabel(s)}</li>
          ))}
        </ul>
        <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "cancelOffer", key: offerKey })}>
          {L.cancel}
        </button>
      </div>
    );
  return (
    <div className="offer-box">
      {offer?.declined && <p className="offer-declined">{L.declined}</p>}
      <p className="muted">{L.lead}</p>
      {slots.map((s, i) => (
        <div key={i} className="offer-row">
          <span className="muted offer-label">{L.slot(i + 1)}</span>
          <input type="date" min={DEMO_TODAY} value={s.date} onChange={(e) => set(i, { date: e.target.value })} aria-label={`${L.slot(i + 1)}の日`} />
          <select value={s.time} onChange={(e) => set(i, { time: e.target.value })} aria-label={`${L.slot(i + 1)}の時間`}>
            {L.times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      ))}
      <button
        className="btn-outline btn-small"
        disabled={ready.length === 0}
        onClick={() => {
          dispatch({ type: "offerMeeting", key: offerKey, slots: ready });
          setSlots([empty, empty, empty]);
        }}
      >
        {L.send}
      </button>
    </div>
  );
}

// 産業医との面談を実施済みにする。そのとき、産業医の意見を短く残す
function OccDone({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  const [verdict, setVerdict] = useState<OccOpinion["verdict"] | null>(null);
  const [note, setNote] = useState("");
  if (!open)
    return (
      <button className="btn-outline btn-small" onClick={() => setOpen(true)}>
        {HR.companyDone}
      </button>
    );
  return (
    <div className="opinion-form">
      <p className="opinion-title">{HR.opinion.title}</p>
      <p className="muted">{HR.opinion.verdict}</p>
      <div className="chips">
        {(Object.keys(HR.opinion.options) as OccOpinion["verdict"][]).map((v) => (
          <button key={v} className="chip" aria-pressed={verdict === v} onClick={() => setVerdict(v)}>
            {HR.opinion.options[v]}
          </button>
        ))}
      </div>
      <label className="muted">
        {HR.opinion.note}
        <textarea className="hr-textarea" rows={2} placeholder={HR.opinion.noteExample} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="confirm-actions">
        <button
          className="btn-primary btn-small"
          disabled={!verdict}
          onClick={() => verdict && dispatch({ type: "finishOccMeeting", opinion: { verdict, note: note.trim() } })}
        >
          {HR.opinion.save}
        </button>
        <button className="btn-quiet btn-small" onClick={() => setOpen(false)}>
          {HR.opinion.cancel}
        </button>
      </div>
    </div>
  );
}

function IssuesRef({ row }: { row: HrRow }) {
  if (!row.issues && row.issueNotes.length === 0) return null;
  return (
    <details className="issues-ref">
      <summary>{INVITE.issuesRef}</summary>
      <IssuesBody row={row} />
    </details>
  );
}

function BackButton({ dispatch, bottom }: { dispatch: Dispatch<Action>; bottom?: boolean }) {
  return (
    <button className={`btn-quiet hr-back${bottom ? " hr-back-bottom" : ""}`} onClick={() => dispatch({ type: "hrSelect", id: null })}>
      ← {HR.back}
    </button>
  );
}

// 段階は「次へ進める」操作で変える。戻すのは例外なので、小さく置く
// 準備期に進める条件：本人の準備の進め方に当てはまる条件だけを出す
function prepConditions(state: State): { ok: boolean; message?: string; items: { label: string; ok: boolean }[] } {
  const c = state.prepConds;
  if (state.prepPath === null) return { ok: false, message: HR.condNoPath, items: [] };
  const items: { label: string; ok: boolean }[] = [];
  if (state.prepPath === "self") {
    if (c.selfCheck)
      items.push({
        label: HR.prepCond.selfCheck,
        ok: RECOVERY.next.self.every((i) => state.recoveryChecks.includes(i)),
      });
    if (c.companyMeeting) items.push({ label: HR.prepCond.companyMeeting, ok: state.companyMeeting?.status === "done" });
    if (c.selfReport) items.push({ label: HR.prepCond.selfReport, ok: state.selfReports.length > 0 });
  } else if (c.attendance) {
    const last = state.reworkReports[state.reworkReports.length - 1];
    items.push({ label: HR.prepCond.attendance(c.attendanceRate), ok: !!last && last.rate >= c.attendanceRate });
  }
  if (items.length === 0) return { ok: true, message: HR.condNone, items };
  return { ok: items.every((i) => i.ok), items };
}

function StageControl({ row, state, dispatch }: { row: HrRow } & Props) {
  const i = STAGES.indexOf(state.stage);
  const next = STAGES[i + 1];
  const prev = i > 0 ? STAGES[i - 1] : undefined;
  const nextLabel = HR.nextLabel[state.stage];
  // 急性期→回復期は、復職コーディネーターとの面談（回復期に進む前の面談）が済むまで進められない
  // 回復期→準備期は、会社の設定で選んだ条件がそろうまで進められない
  const conds = state.stage === "recovery" ? prepConditions(state) : null;
  const locked = (state.stage === "acute" && !state.psychMeetingDone) || (conds !== null && !conds.ok);

  return (
    <div className="stage-control">
      {state.stage === "acute" && (
        <div className="psych">
          <p>
            {state.psychMeetingDone ? HR.psychDone : state.rivaMeetingApplied ? HR.psychApplied : HR.psychNone}
          </p>
          {state.psychMeetingDone && (
            <div className="wish-box">
              <p>
                <span className="wish-label">{HR.wishLabel}</span>
                {state.nextWish ? <strong>{ACUTE.wishOptions[state.nextWish]}</strong> : <span className="muted">{HR.wishNone}</span>}
              </p>
              <p className="muted">{HR.wishDecide}</p>
            </div>
          )}
          {/* 面談が済んだかを知っているのは支援機関。人事が記録するのではなく、実施の報告が届く */}
          {state.rivaMeetingApplied && !state.psychMeetingDone && (
            <div className="meeting-action demo-report">
              <span className="muted">{HR.demoReport}</span>
              {state.psychSchedule?.chosen ? (
                <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "markPsychDone" })}>
                  {HR.reportDone}
                </button>
              ) : state.psychSchedule ? (
                <span className="muted">{HR.waitingPick}</span>
              ) : (
                <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "offerSlots", kind: "psych" })}>
                  {HR.reportScheduled}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {conds && (
        <div className="conds">
          <p className="conds-title">{HR.condTitle}</p>
          {conds.message ? (
            <p className="muted">{conds.message}</p>
          ) : (
            <ul className="conds-list">
              {conds.items.map((c) => (
                <li key={c.label}>
                  <span className={`status-tag${c.ok ? " status-done" : ""}`}>{c.ok ? HR.condMet : HR.condNotYet}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          )}
          {/* デモ：リワークの施設から、出席の事実だけの月次レポートが届く */}
          {state.prepPath !== null && state.prepPath !== "self" && (
            <div className="meeting-action demo-report">
              <span className="muted">{HR.demoReport}</span>
              <button className="btn-quiet btn-small" onClick={() => dispatch({ type: "reworkReport" })}>
                {HR.reportArrive}
              </button>
            </div>
          )}
          {state.prepPath === "self" && <SelfReportRef state={state} dispatch={dispatch} />}
        </div>
      )}

      {nextLabel && next &&
        (locked ? (
          <>
            <button className="btn-primary" disabled>
              {nextLabel}
            </button>
            <p className="muted">{state.stage === "acute" ? HR.nextLockedAcute : HR.condLocked}</p>
          </>
        ) : (
          <ConfirmButton
            key={state.stage}
            label={nextLabel}
            confirm={HR.confirmNext(row.name, STAGE_LABELS[state.stage], STAGE_LABELS[next])}
            yes={HR.nextYes}
            no={HR.confirmNo}
            onConfirm={() => dispatch({ type: "setStage", stage: next })}
          />
        ))}
      {state.stage === "preReturn" && <ReturnSteps row={row} state={state} dispatch={dispatch} />}

      {prev && (
        <div className="stage-back">
          <ConfirmButton
            key={`back-${state.stage}`}
            quiet
            label={HR.backLabel}
            confirm={HR.confirmBack(row.name, STAGE_LABELS[state.stage], STAGE_LABELS[prev])}
            yes={HR.backYes}
            no={HR.confirmNo}
            onConfirm={() => dispatch({ type: "setStage", stage: prev })}
          />
        </div>
      )}
    </div>
  );
}

// 送る前に、宛先と本文をもう一度見せる
function SendMessage({
  personId,
  name,
  stage,
  occDate = null,
  row,
  by,
  ownTemplates,
  dispatch,
}: {
  personId: string;
  name: string;
  stage: Stage;
  occDate?: string | null;
  row?: HrRow;
  by?: string;
  ownTemplates?: { title: string; text: string; noReply: boolean }[];
  dispatch: Dispatch<Action>;
}) {
  const templates = ownTemplates
    ? ownTemplates
    : stage === "acute"
      ? HR.templates
      : stage === "preReturn"
        ? [...HR.templates, ...HR.templatesFromRecovery, ...HR.templatesPreReturn(occDate)]
        : [...HR.templates, ...HR.templatesFromRecovery];
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [noReply, setNoReply] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);

  return (
    <section className="hr-card" id="sec-send">
      <h2>{HR.sendTitle(name)}</h2>
      {by && <p className="muted">{BOSS.sendNote}</p>}
      {row && <TodoHere row={row} section="sec-send" dispatch={dispatch} />}
      {sent ? (
        <>
          <p className="done-note">{HR.sent}</p>
          <button className="btn-quiet" onClick={() => setSent(false)}>
            {HR.sendTitle(name)}
          </button>
        </>
      ) : checking ? (
        <div className="confirm send-check">
          <p>{HR.sendCheck(name)}</p>
          <blockquote className="send-preview">
            <strong>{HR.sendCheckSubject(title.trim())}</strong>
            {text.trim()}
          </blockquote>
          {noReply && <p className="muted">{HR.sendCheckNoReply}</p>}
          <div className="confirm-actions">
            <button
              className="btn-primary"
              onClick={() => {
                dispatch({ type: "sendHrMessage", personId, title: title.trim(), body: text.trim(), noReplyNeeded: noReply, by });
                setTitle("");
                setText("");
                setNoReply(false);
                setChecking(false);
                setSent(true);
              }}
            >
              {HR.send}
            </button>
            <button className="btn-quiet" onClick={() => setChecking(false)}>
              {HR.confirmNo}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="muted">{HR.sendNote}</p>
          <div className="chips">
            {templates.map((t) => (
              <button
                key={t.text}
                className="chip"
                aria-pressed={text === t.text}
                onClick={() => {
                  setTitle(t.title);
                  setText(t.text);
                  setNoReply(t.noReply);
                }}
              >
                {t.title}
              </button>
            ))}
          </div>
          <label className="hr-field">
            {HR.subject}
            <input className="hr-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="hr-field">
            {HR.bodyLabel}
            <textarea className="hr-textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={noReply} onChange={(e) => setNoReply(e.target.checked)} />
            {HR.noReply}
          </label>
          <SendHint stage={stage} boss={Boolean(by)} events={row?.events ?? []} title={title} text={text} />
          <button
            className="btn-primary send-row"
            disabled={!text.trim() || !title.trim()}
            onClick={() => setChecking(true)}
          >
            {HR.send}
          </button>
        </>
      )}
    </section>
  );
}

// ---------- 上司の画面 ----------
// 上司が見るのは、自分が担当している休職者の、段階・本人とのやり取り・会社との面談の日程だけ。
// 体調の記録や提出物、会社の見立ては出さない（人事・産業保健スタッフが受け取る）
function BossApp({ state, dispatch }: Props) {
  const me = state.contactBy === "boss" ? state.hrAccounts.find((a) => a.id === currentBossId(state)) : undefined;
  // 復職・退職したら、上司も見られなくなる（hrRows は復職した人を含めない）
  const rows = me ? hrRows(state).filter((r) => r.bossId === me.id) : [];
  const selected = rows.find((r) => r.id === state.hrSelected);
  if (!me)
    return (
      <section className="hr-card">
        <p className="muted">{BOSS.noBoss}</p>
      </section>
    );
  if (selected) return <BossDetail row={selected} me={me} state={state} dispatch={dispatch} />;
  return (
    <>
      <div className="hr-head">
        <h1 className="hr-title">{BOSS.listTitle}</h1>
      </div>
      <p className="muted">{BOSS.whoami(me.name)}</p>
      <section className="hr-card boss-intro">
        <h2>{BOSS.introTitle}</h2>
        <ul>
          {BOSS.intro.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <p className="muted">{BOSS.listNote}</p>
      {rows.length === 0 ? (
        <section className="hr-card">
          <p className="muted">{BOSS.listEmpty}</p>
        </section>
      ) : (
        <ul className="boss-list">
          {rows.map((r) => {
            const waiting = bossTodos(r).length;
            return (
              <li key={r.id}>
                <button className="boss-row" onClick={() => dispatch(selectRow(r))}>
                  <span className="boss-name">
                    {r.name}
                    <span className="muted">　{r.dept}</span>
                  </span>
                  <StageTag stage={r.stage} />
                  {waiting > 0 && <span className="new-tag">{BOSS.todoCount(waiting)}</span>}
                  <span aria-hidden="true">›</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function BossDetail({ row, me, state, dispatch }: { row: HrRow; me: HrAccount } & Props) {
  const todos = bossTodos(row);
  const events = bossEvents(row);
  const [shown, setShown] = useState<number>(HR.historyPage);
  // 会社との面談（準備期に進むための面談・産業医との面談）の日程だけ。支援機関との面談は出さない
  const meetings = row.live ? meetingsOf(state).filter((m) => m.key === "company" || m.key === "occ") : [];
  const by = BOSS.by(me.name);
  // 連絡を取りすぎないように：急性期に、この30日で上司が送った回数
  const recent = row.live ? state.hrMessages.filter((m) => m.by === by && daysSince(m.date) <= 30).length : 0;
  const hints = BOSS.hints[row.stage];
  return (
    <>
      <BackButton dispatch={dispatch} />
      <div className="hr-head">
        <h1 className="hr-title">
          {row.name}　<span className="muted">{row.dept}</span>
        </h1>
        <StageTag stage={row.stage} />
      </div>
      <p className="muted boss-scope">{BOSS.scope}</p>

      {todos.length > 0 && (
        <section className="hr-card hr-card-todo">
          <h2>{HR.todoTitle}</h2>
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.key} className="todo-detail">
                <TodoText todo={todo} />
                <button className="btn-outline btn-small" onClick={() => goTo("sec-send")}>
                  {HR.todoGo} ›
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="hr-columns">
        <section className="hr-card">
          <h2>{BOSS.historyTitle}</h2>
          <HistorySummary events={events} audience="boss" rowId={row.id} reveal={(n) => setShown((s) => Math.max(s, n))} />
          <ol className="timeline">
            {[...events].reverse().slice(0, shown).map((e, i) => (
              <li key={i} id={tlId("boss", events.length - 1 - i)} className={`tl tl-${e.kind}`}>
                <span className="tl-date">{shortDate(e.date)}</span>
                <span className="tl-kind">
                  {e.kind === "stage" ? HR.event.stage(e.body) : e.kind === "fromHr" && e.by ? BOSS.fromBoss : HR.event[e.kind]}
                  <EventTags e={e} />
                </span>
                {e.kind !== "stage" && <span className="tl-body">{e.body}</span>}
              </li>
            ))}
          </ol>
          <MoreButton total={events.length} shown={shown} onMore={() => setShown((s) => s + HR.historyPage)} />
        </section>

        <div>
          <section className="hr-card">
            <h2>
              {HR.stageTitle}　<StageTag stage={row.stage} />
            </h2>
            {BOSS.stageMeaning[row.stage] && (
              <p className="boss-stage-meaning">
                {BOSS.stageMeaning[row.stage]}
                <span className="muted">　{BOSS.stageSpan}</span>
              </p>
            )}
            {row.pending ? (
              <p className="muted">{BOSS.pending}</p>
            ) : (
              hints.length > 0 && (
                <div className="boss-hints">
                  <p className="boss-hints-title">{BOSS.hintTitle}</p>
                  <ul>
                    {hints.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  {row.stage === "acute" && recent >= 2 && <p className="boss-too-many">{BOSS.tooMany(recent)}</p>}
                  <p className="muted">{BOSS.hintNote}</p>
                </div>
              )
            )}
          </section>

          {meetings.length > 0 && (
            <section className="hr-card">
              <h2>{BOSS.meetingTitle}</h2>
              <p className="muted">{BOSS.meetingNote}</p>
              <ul className="meeting-list">
                {meetings.map((m) => (
                  <li key={m.key}>
                    <span>{m.name}</span>
                    <span className="status-tag">{m.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!row.pending && row.stage !== "afterReturn" && (
            <SendMessage
              key={row.id}
              personId={row.id}
              name={row.name}
              stage={row.stage}
              row={{ ...row, todos }}
              by={by}
              ownTemplates={BOSS.templates[row.stage]}
              dispatch={dispatch}
            />
          )}
        </div>
      </div>
      <BackButton dispatch={dispatch} bottom />
    </>
  );
}
