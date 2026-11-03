import { useEffect, useState, type Dispatch } from "react";
import { ANALYTICS, HR, STAGE_LABELS, type Stage } from "../constants/labels";
import Analytics from "./Analytics";
import { daysSince } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton } from "../person/parts";
import { daysUntil, hrRows, isIncoming, meetingsOf, sortTodos, type HrRow } from "./hrData";
import { DEMO_TODAY, PERSON, type HrEvent, type HrTodo } from "../data/demo";

type Props = { state: State; dispatch: Dispatch<Action> };

const STAGES: Stage[] = ["acute", "recovery", "preReturn", "afterReturn"];
const shortDate = (d: string) => d.replace(/-/g, "/");

// 会社（人事・産業保健）の画面。本人が提出したもの・やり取り・申し込みがあったことだけを表示する
export default function HrApp({ state, dispatch }: Props) {
  const rows = hrRows(state);
  const selected = rows.find((r) => r.id === state.hrSelected);

  // 一覧と詳しい画面を切り替えたら、いちばん上から見せる
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.hrSelected, state.hrPage]);

  if (selected)
    return (
      <div className="hr">
        <HrDetail row={selected} state={state} dispatch={dispatch} />
      </div>
    );
  return (
    <div className="hr">
      <nav className="hr-nav">
        {(["list", "analytics"] as const).map((p) => (
          <button key={p} aria-current={state.hrPage === p ? "page" : undefined} onClick={() => dispatch({ type: "hrPage", page: p })}>
            {ANALYTICS.nav[p]}
          </button>
        ))}
      </nav>
      {state.hrPage === "analytics" ? <Analytics /> : <HrList rows={rows} state={state} dispatch={dispatch} />}
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

function DoneButton({ todo, personId, dispatch }: { todo: HrTodo; personId: string; dispatch: Dispatch<Action> }) {
  return (
    <button className="btn-outline btn-small" onClick={() => dispatch({ type: "hrMarkDone", key: todo.key, personId, text: todo.text })}>
      {HR.done}
    </button>
  );
}

// リクエストに人事ができるのは、チケットを補充することだけ（補充すると受け付けられる）
const REQUEST_KEY = "a-coord-req";

function RefillButton({ label, dispatch }: { label: string; dispatch: Dispatch<Action> }) {
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
    return { e, isNew: n > row.newFrom };
  });
}

function StageTag({ stage }: { stage: Stage }) {
  return <span className={`stage-tag stage-${stage}`}>{STAGE_LABELS[stage]}</span>;
}

function HrList({ rows, state, dispatch }: { rows: HrRow[] } & Props) {
  const todos = sortTodos(rows.flatMap((r) => r.todos.map((todo) => ({ row: r, todo }))));
  const open = (r: HrRow) => dispatch({ type: "hrSelect", id: r.id, incoming: r.incoming, prevSeen: r.seen });

  return (
    <>
      <div className="hr-head">
        <h1 className="hr-title">{HR.title}</h1>
        <aside className="notify">
          <p className="notify-title">{HR.notifyTitle}</p>
          <p className="notify-body">{HR.notifyBody}</p>
          <p className="muted">{HR.notifyNote}</p>
        </aside>
      </div>

      <div className="tiles">
        <div className="tile">
          <p className="tile-label">{HR.people}</p>
          <p className="tile-value">{HR.peopleUnit(rows.length)}</p>
        </div>
        <div className="tile">
          <p className="tile-label">{HR.todoCount}</p>
          <p className="tile-value">{HR.todoUnit(todos.length)}</p>
        </div>
        <div className="tile tile-wide">
          <p className="tile-label">{HR.tickets}</p>
          <div className="tile-row">
            <p className="tile-value">{HR.ticketsUnit(state.ticketsLeft)}</p>
            <RefillButton label={HR.refill} dispatch={dispatch} />
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
                {/* 中身を確かめてから対応するので、一覧では開くだけ。対応済みは詳しい画面で */}
                <span className="todo-actions">
                  <button className="btn-outline btn-small" onClick={() => open(row)}>
                    {HR.open}
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
              <th>{HR.cols.name}</th>
              <th>{HR.cols.dept}</th>
              <th>{HR.cols.stage}</th>
              <th>{HR.cols.days}</th>
              <th>{HR.cols.end}</th>
              <th>{HR.cols.rework}</th>
              <th>{HR.cols.news}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => open(r)}>
                <td>
                  <button className="link-row">{r.name}</button>
                </td>
                <td>{r.dept}</td>
                <td>
                  <StageTag stage={r.stage} />
                </td>
                <td>{HR.days(daysSince(r.leaveStart))}</td>
                <td>{shortDate(r.leaveEnd)}</td>
                <td>{r.rework}</td>
                <td>{r.news > 0 ? <span className="news">{HR.newsCount(r.news)}</span> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="muted table-note">{HR.newsNote}</p>
      </section>

      {state.stage === "afterReturn" && (
        <section className="hr-card">
          <h2>{HR.returnedTitle}</h2>
          <p className="muted">{HR.returnedNote}</p>
          <ul className="returned-list">
            <li>
              <span className="todo-name">{PERSON.name}</span>
              <span className="muted">{PERSON.dept}</span>
              {state.returnPlan && <span>{HR.afterReturnDate(shortDate(state.returnPlan.date))}</span>}
              {state.returnPlan?.accommodation && <span>{HR.afterReturnAccommodation(state.returnPlan.accommodation)}</span>}
            </li>
          </ul>
        </section>
      )}

      <CompanySettings state={state} dispatch={dispatch} />
    </>
  );
}

function HrDetail({ row, state, dispatch }: { row: HrRow } & Props) {
  // 開く前に見ていなかったもの。経緯の中だけだと埋もれるので、いちばん上にも出す
  const newItems = markNew(row).filter((x) => x.isNew).reverse();
  return (
    <>
      <BackButton dispatch={dispatch} />
      <div className="hr-head">
        <h1 className="hr-title">
          {row.name}　<span className="muted">{row.dept}</span>
        </h1>
        <StageTag stage={row.stage} />
      </div>

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
                  <RefillButton label={HR.refillTodo} dispatch={dispatch} />
                ) : (
                  <DoneButton todo={todo} personId={row.id} dispatch={dispatch} />
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
          <ol className="timeline">
            {markNew(row).reverse().map(({ e, isNew }, i) => (
              <li key={i} className={`tl tl-${e.kind}${isNew ? " tl-new" : ""}`}>
                <span className="tl-date">{shortDate(e.date)}</span>
                <span className="tl-kind">
                  {e.kind === "stage" ? HR.event.stage(e.body) : HR.event[e.kind]}
                  {isNew && <span className="new-tag">{HR.newTag}</span>}
                  <EventTags e={e} />
                </span>
                {e.kind !== "stage" && <span className="tl-body">{e.body}</span>}
              </li>
            ))}
          </ol>
          <p className="muted hidden-note">{HR.hidden}</p>
        </section>

        <div>
          <section className="hr-card">
            <h2>
              {HR.stageTitle}　<StageTag stage={row.stage} />
            </h2>
            <p className="muted stage-guide">{HR.stageGuide[row.stage]}</p>
            {row.live ? <StageControl row={row} state={state} dispatch={dispatch} /> : <p className="muted">{HR.stageDemoOnly}</p>}
          </section>

          {row.live && <Meetings state={state} dispatch={dispatch} />}
          {row.live && <SendMessage name={row.name} stage={row.stage} dispatch={dispatch} />}
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
  const [date, setDate] = useState("");
  const list = meetingsOf(state);
  if (list.length === 0) return null;
  const c = state.companyMeeting;
  // 支援機関の報告：日程の候補を送った → （本人が選ぶ）→ 実施した。リクエストは、難しいと連絡することもある
  const coordOpen = state.coordinatorMeeting !== null && state.coordinatorReport === null;
  const cs = state.coordSchedule;

  return (
    <section className="hr-card">
      <h2>{HR.meetingTitle}</h2>
      <ul className="meeting-list">
        {list.map((m) => (
          <li key={m.key}>
            <span>{m.name}</span>
            <span className="status-tag">{m.status}</span>
          </li>
        ))}
      </ul>

      {c?.status === "applied" && (
        <div className="meeting-action">
          <label className="muted">
            {HR.companyDate}
            <input type="date" min={DEMO_TODAY} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button className="btn-outline btn-small" disabled={!date} onClick={() => dispatch({ type: "scheduleCompanyMeeting", date })}>
            {HR.companySchedule}
          </button>
        </div>
      )}
      {c?.status === "scheduled" && (
        <div className="meeting-action">
          <button className="btn-outline btn-small" onClick={() => dispatch({ type: "finishCompanyMeeting" })}>
            {HR.companyDone}
          </button>
          <button
            className="btn-quiet btn-small"
            onClick={() => {
              setDate(c.date ?? "");
              dispatch({ type: "rescheduleCompanyMeeting" });
            }}
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
  const [occDate, setOccDate] = useState("");
  const [planDate, setPlanDate] = useState(state.returnPlan?.date ?? "");
  const [accommodation, setAccommodation] = useState(state.returnPlan?.accommodation ?? "");
  const occ = state.occMeeting;
  const plan = state.returnPlan;
  const [editing, setEditing] = useState(!state.returnPlan);
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
      {!occ && (
        <div className="meeting-action">
          <label className="muted">
            {HR.companyDate}
            <input type="date" min={DEMO_TODAY} value={occDate} onChange={(e) => setOccDate(e.target.value)} />
          </label>
          <button className="btn-outline btn-small" disabled={!occDate} onClick={() => dispatch({ type: "scheduleOccMeeting", date: occDate })}>
            {HR.companySchedule}
          </button>
        </div>
      )}
      {occ?.status === "scheduled" && (
        <div className="meeting-action">
          <button className="btn-outline btn-small" onClick={() => dispatch({ type: "finishOccMeeting" })}>
            {HR.companyDone}
          </button>
          <button
            className="btn-quiet btn-small"
            onClick={() => {
              setOccDate(occ.date);
              dispatch({ type: "rescheduleOccMeeting" });
            }}
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
      {editing ? (
        <div className="plan-form">
          <label className="muted">
            {HR.returnDate}
            <input type="date" min={DEMO_TODAY} value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
          </label>
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
function CompanySettings({ state, dispatch }: Props) {
  return (
    <section className="hr-card">
      <h2>{HR.settingsTitle}</h2>
      <p className="muted">{HR.settingsNote}</p>
      <fieldset className="return-order">
        <legend>{HR.returnOrderLabel}</legend>
        {(["occFirst", "doctorFirst"] as const).map((o) => (
          <label key={o} className="check">
            <input type="radio" name="return-order" checked={state.returnOrder === o} onChange={() => dispatch({ type: "setReturnOrder", order: o })} />
            {HR.returnOrders[o]}
          </label>
        ))}
        <p className="muted">{HR.returnOrderNote[state.returnOrder]}</p>
      </fieldset>
    </section>
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
function StageControl({ row, state, dispatch }: { row: HrRow } & Props) {
  const i = STAGES.indexOf(state.stage);
  const next = STAGES[i + 1];
  const prev = i > 0 ? STAGES[i - 1] : undefined;
  const nextLabel = HR.nextLabel[state.stage];
  // 急性期→回復期は、心理の専門家との面談が済むまで進められない
  const locked = state.stage === "acute" && !state.psychMeetingDone;

  return (
    <div className="stage-control">
      {state.stage === "acute" && (
        <div className="psych">
          <p>
            {state.psychMeetingDone ? HR.psychDone : state.rivaMeetingApplied ? HR.psychApplied : HR.psychNone}
          </p>
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

      {nextLabel && next &&
        (locked ? (
          <>
            <button className="btn-primary" disabled>
              {nextLabel}
            </button>
            <p className="muted">{HR.nextLockedAcute}</p>
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
function SendMessage({ name, stage, dispatch }: { name: string; stage: Stage; dispatch: Dispatch<Action> }) {
  const templates = stage === "acute" ? HR.templates : [...HR.templates, ...HR.templatesFromRecovery];
  const [text, setText] = useState("");
  const [noReply, setNoReply] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);

  return (
    <section className="hr-card">
      <h2>{HR.sendTitle(name)}</h2>
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
          <blockquote className="send-preview">{text.trim()}</blockquote>
          {noReply && <p className="muted">{HR.sendCheckNoReply}</p>}
          <div className="confirm-actions">
            <button
              className="btn-primary"
              onClick={() => {
                dispatch({ type: "sendHrMessage", body: text.trim(), noReplyNeeded: noReply });
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
                  setText(t.text);
                  setNoReply(t.noReply);
                }}
              >
                {t.text}
              </button>
            ))}
          </div>
          <textarea className="hr-textarea" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <label className="check">
            <input type="checkbox" checked={noReply} onChange={(e) => setNoReply(e.target.checked)} />
            {HR.noReply}
          </label>
          <button
            className="btn-primary send-row"
            disabled={!text.trim()}
            onClick={() => setChecking(true)}
          >
            {HR.send}
          </button>
        </>
      )}
    </section>
  );
}
