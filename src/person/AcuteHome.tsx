import { useState, type Dispatch } from "react";
import { ACUTE, REST, greeting } from "../constants/labels";
import { PERSON } from "../data/demo";
import type { Action, State } from "../state/store";
import { ConfirmButton, CoordinatorCard, DiaryEntryCard, HrNoticeList, ReadingsCard } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 急性期：やることを求めない、静かなホーム。赤いバッジや数字は出さない
export default function AcuteHome({ state, dispatch }: Props) {
  const allChecked = state.acuteChecks.every(Boolean);
  // 次の段階への道すじの、いまの位置（チェック → 専門家との面談 → 希望を伝える）
  const stepNow = !allChecked ? 0 : !state.psychMeetingDone ? 1 : 2;
  // 急性期は、面談は1つずつ。心理の専門家との面談（チケット）が済むまでは、回復期に進む前のコーディネーターとの面談を申し込めない
  const coordBusy = state.coordinatorMeeting !== null && state.coordinatorReport === null;

  return (
    <div className="home home-acute">
      <p className="greeting">{greeting(PERSON.name, new Date().getHours())}</p>
      <p className="lead">{ACUTE.message}</p>

      <DiaryEntryCard state={state} dispatch={dispatch} />

      {state.psychMeetingDone && <WishCard state={state} dispatch={dispatch} />}

      <ReadingsCard />

      {/* 大きく体調を崩している時期なので、休息モードと同じく、チケットがなければ公的な窓口を出す */}
      <CoordinatorCard state={state} dispatch={dispatch} title={REST.hardTitle} note={REST.hardNote} publicWhenEmpty />

      <section className="card">
        <h2>{ACUTE.todoTitle}</h2>
        <p>{ACUTE.todo}</p>
      </section>

      {/* 人事からの連絡は、上にあるとプレッシャーになるので下に。急性期は新しい1件だけ（仕様どおり） */}
      <HrNoticeList messages={state.hrMessages} max={1} dispatch={dispatch} />

      <details className="card card-quiet">
        <summary>{ACUTE.checkTitle}</summary>
        <p className="muted">{ACUTE.checkNote}</p>
        <ol className="next-steps">
          {ACUTE.checkSteps.map((s, i) => (
            <li key={s} className={i === stepNow ? "step-now" : i < stepNow ? "step-done" : undefined}>
              {s}
              {i === stepNow && <span className="tag-soft">{ACUTE.checkHere}</span>}
              {i === 1 && stepNow === 1 && state.psychSchedule?.chosen && (
                <span className="step-sub">{ACUTE.checkStepDate(state.psychSchedule.chosen)}</span>
              )}
            </li>
          ))}
        </ol>
        <ul className="list-plain">
          {ACUTE.checkItems.map((item, i) => (
            <li key={item}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={state.acuteChecks[i]}
                  onChange={() => dispatch({ type: "toggleAcuteCheck", index: i })}
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
        {allChecked && (
          <div className="next-step">
            <p>{ACUTE.checkAllDone}</p>
            {state.rivaMeetingApplied ? (
              <p className="done-note">{ACUTE.checkApplied}</p>
            ) : coordBusy ? (
              <p className="muted">{ACUTE.busyCoord}</p>
            ) : (
              <ConfirmButton
                quiet
                modal
                label={ACUTE.checkButton}
                confirm={ACUTE.checkConfirm}
                yes={ACUTE.checkConfirmYes}
                no={ACUTE.checkConfirmNo}
                onConfirm={() => dispatch({ type: "applyRivaMeeting" })}
              />
            )}
          </div>
        )}
      </details>
    </div>
  );
}

// 復職コーディネーターとの面談のあと、これからの希望を会社に伝える。選ぶだけ（急性期に書かせない）。選ぶ → 届く文を見る → 送る
function WishCard({ state, dispatch }: Props) {
  const [picked, setPicked] = useState<"go" | "rest" | null>(null);
  const [changing, setChanging] = useState(false);

  if (state.nextWish && !changing)
    return (
      <section className="card">
        <h2>{ACUTE.wishTitle}</h2>
        <p className="done-note">{ACUTE.wishSent(ACUTE.wishOptions[state.nextWish])}</p>
        <button className="btn-quiet" onClick={() => setChanging(true)}>
          {ACUTE.wishChange}
        </button>
      </section>
    );

  return (
    <section className="card">
      <h2>{ACUTE.wishTitle}</h2>
      <p className="muted">{ACUTE.wishNote}</p>
      <div className="chips chips-stack">
        {(["go", "rest"] as const).map((w) => (
          <button key={w} className="chip" aria-pressed={picked === w} onClick={() => setPicked(w)}>
            {ACUTE.wishOptions[w]}
          </button>
        ))}
      </div>
      {picked && (
        <div className="preview">
          <p className="muted">{ACUTE.wishPreview}</p>
          <p>{ACUTE.wishBody(ACUTE.wishOptions[picked])}</p>
        </div>
      )}
      <div className="confirm-actions">
        <button
          className="btn-primary"
          disabled={!picked}
          onClick={() => {
            if (!picked) return;
            dispatch({ type: "sendWish", wish: picked });
            setPicked(null);
            setChanging(false);
          }}
        >
          {ACUTE.wishSend}
        </button>
        {changing && (
          <button className="btn-quiet" onClick={() => setChanging(false)}>
            {ACUTE.checkConfirmNo}
          </button>
        )}
      </div>
    </section>
  );
}
