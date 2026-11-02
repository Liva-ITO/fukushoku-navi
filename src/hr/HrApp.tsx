import { useState, type Dispatch } from "react";
import { HR, STAGE_LABELS, type Stage } from "../constants/labels";
import { daysSince } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton } from "../person/parts";
import { daysUntil, hrRows, isIncoming, sortTodos, type HrRow } from "./hrData";
import type { HrTodo } from "../data/demo";

type Props = { state: State; dispatch: Dispatch<Action> };

const STAGES: Stage[] = ["acute", "recovery", "preReturn", "afterReturn"];
const shortDate = (d: string) => d.replace(/-/g, "/");

// 会社（人事・産業保健）の画面。本人が提出したもの・やり取り・申し込みがあったことだけを表示する
export default function HrApp({ state, dispatch }: Props) {
  const rows = hrRows(state);
  const selected = rows.find((r) => r.id === state.hrSelected);

  return (
    <div className="hr">
      {selected ? (
        <HrDetail row={selected} state={state} dispatch={dispatch} />
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

function DoneButton({ todo, personId, dispatch }: { todo: HrTodo; personId: string; dispatch: Dispatch<Action> }) {
  return (
    <button className="btn-outline btn-small" onClick={() => dispatch({ type: "hrMarkDone", key: todo.key, personId, text: todo.text })}>
      {HR.done}
    </button>
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
            <button className="btn-outline" onClick={() => dispatch({ type: "refillTickets" })}>
              {HR.refill}
            </button>
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
                <span className="todo-actions">
                  <button className="btn-quiet" onClick={() => open(row)}>
                    {HR.open}
                  </button>
                  <DoneButton todo={todo} personId={row.id} dispatch={dispatch} />
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
    </>
  );
}

function HrDetail({ row, state, dispatch }: { row: HrRow } & Props) {
  // 開く前に見ていなかったもの。経緯の中だけだと埋もれるので、いちばん上にも出す
  const newItems = markNew(row).filter((x) => x.isNew).reverse();
  return (
    <>
      <button className="btn-quiet hr-back" onClick={() => dispatch({ type: "hrSelect", id: null })}>
        ← {HR.back}
      </button>
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
                <span className="tl-kind">{HR.event[e.kind as "fromPerson" | "submit" | "meeting"]}</span>
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
                <DoneButton todo={todo} personId={row.id} dispatch={dispatch} />
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

          {row.live && <SendMessage dispatch={dispatch} />}
        </div>
      </div>
    </>
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
          {state.rivaMeetingApplied && !state.psychMeetingDone && (
            <button className="btn-quiet" onClick={() => dispatch({ type: "markPsychDone" })}>
              {HR.psychDoneButton}
            </button>
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
      {state.stage === "preReturn" && <p className="muted">{HR.preReturnSoon}</p>}

      {prev && state.stage !== "afterReturn" && (
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

function SendMessage({ dispatch }: { dispatch: Dispatch<Action> }) {
  const [text, setText] = useState("");
  const [noReply, setNoReply] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <section className="hr-card">
      <h2>{HR.sendTitle}</h2>
      {sent ? (
        <>
          <p className="done-note">{HR.sent}</p>
          <button className="btn-quiet" onClick={() => setSent(false)}>
            {HR.sendTitle}
          </button>
        </>
      ) : (
        <>
          <p className="muted">{HR.sendNote}</p>
          <div className="chips">
            {HR.templates.map((t) => (
              <button key={t} className="chip" aria-pressed={text === t} onClick={() => setText(t)}>
                {t}
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
            onClick={() => {
              dispatch({ type: "sendHrMessage", body: text.trim(), noReplyNeeded: noReply });
              setText("");
              setNoReply(false);
              setSent(true);
            }}
          >
            {HR.send}
          </button>
        </>
      )}
    </section>
  );
}
