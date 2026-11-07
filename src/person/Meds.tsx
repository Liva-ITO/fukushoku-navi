import { useState, type Dispatch } from "react";
import { MED } from "../constants/labels";
import { DEMO_TODAY } from "../data/demo";
import {
  PRN_REASONS,
  daysToVisit,
  jpDate,
  newId,
  nowHm,
  prnLast,
  prnTodayCount,
  prnWeek,
  takenToday,
  type DoctorMemoKind,
  type Med,
  type PrnMed,
} from "../data/meds";
import type { Action, State } from "../state/store";
import { ConfirmButton } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// ホームの「きょうの薬」。設定前は入口だけ。設定後は、時間ごとの行と頓服の行
export function MedCard({ state, dispatch }: Props) {
  const meds = state.meds.filter((m) => !m.ended);
  const prns = state.prnMeds.filter((p) => !p.ended);
  const open = (view: NonNullable<State["medView"]>) => dispatch({ type: "medOpen", view });

  if (meds.length === 0 && prns.length === 0) {
    return (
      <section className="card">
        <h2>{MED.cardTitle}</h2>
        <p className="muted">{MED.emptyNote}</p>
        <button className="btn-outline btn-small" onClick={() => open({ kind: "settings" })}>
          {MED.setUp}
        </button>
      </section>
    );
  }

  const rows = meds
    .flatMap((m) => m.times.map((t) => ({ m, t })))
    .sort((a, b) => a.t.at.localeCompare(b.t.at));
  const hasMemo = state.doctorMemo.length > 0 || prnWeek(state).length > 0;

  return (
    <section className="card med-card">
      <h2>{MED.cardTitle}</h2>
      <ul className="med-rows">
        {rows.map(({ m, t }) => {
          const taken = takenToday(state, m.id, t.at);
          return (
            <li key={`${m.id}-${t.at}`} className="med-row">
              <span>
                <span className="med-name">{m.times.length > 1 ? `${m.label} ${t.at}` : m.label}</span>
                <span className="muted med-sub">
                  {taken ? MED.takenAt(taken.takenAt) : t.alarm && state.alarm.on ? MED.alarmAt(t.at) : MED.plainAt(t.at)}
                </span>
              </span>
              {taken ? (
                <button
                  className="med-check"
                  aria-label={MED.undo}
                  title={MED.undo}
                  onClick={() => dispatch({ type: "medUntake", medId: m.id, at: t.at })}
                >
                  ✓
                </button>
              ) : (
                <button
                  className="btn-outline btn-small"
                  onClick={() => dispatch({ type: "medTake", medId: m.id, at: t.at, time: nowHm() })}
                >
                  {MED.took}
                </button>
              )}
            </li>
          );
        })}
        {prns.map((p) => {
          const last = prnLast(state, p.id);
          return (
            <li key={p.id} className="med-row med-row-prn">
              <span>
                <span className="med-name">{MED.prnRow(p.label)}</span>
                <span className="muted med-sub">
                  {last ? MED.prnLast(last.when) : MED.prnNone}
                  {p.intervalHours ? `・${MED.prnInterval(p.intervalHours)}` : ""}
                </span>
              </span>
              <button className="btn-outline btn-small" onClick={() => open({ kind: "prnTake", id: p.id })}>
                {MED.took}
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length > 0 && state.alarm.on && <p className="muted med-note">{MED.beforeAlarm}</p>}
      <div className="med-links">
        {state.nextVisit && <span className="muted">{MED.nextVisit(jpDate(state.nextVisit))}</span>}
        <button className="link-small" onClick={() => open({ kind: "memo" })}>
          {hasMemo ? MED.memoLink : MED.worryLink} ›
        </button>
      </div>
      <div className="med-links">
        <button className="link-small" onClick={() => open({ kind: "settings" })}>
          {MED.settingsLink} ›
        </button>
        {rows.some((r) => r.t.alarm && !takenToday(state, r.m.id, r.t.at)) && state.alarm.on && (
          <button className="link-small link-muted" onClick={() => dispatch({ type: "alarmRing" })}>
            {MED.demoRing}
          </button>
        )}
      </div>
    </section>
  );
}

// 画面の中に出すアラーム。「飲まない」は置かない。「もう一度」は1回だけ
export function AlarmPanel({ state, dispatch }: Props) {
  const a = state.alarmNow;
  if (!a || !a.open) return null;
  const med = state.meds.find((m) => m.id === a.medId);
  if (!med) return null;
  return (
    <section className="alarm-panel" role="alertdialog" aria-label={MED.alarmTitle(med.label)}>
      <p className="alarm-time">{a.at}</p>
      <p className="alarm-title">{MED.alarmTitle(med.label)}</p>
      <p className="muted">{MED.alarmNote}</p>
      <button className="btn-primary btn-wide" onClick={() => dispatch({ type: "medTake", medId: a.medId, at: a.at, time: nowHm() })}>
        {MED.took}
      </button>
      {!a.snoozed && (
        <button className="btn-outline btn-wide" onClick={() => dispatch({ type: "alarmSnooze" })}>
          {MED.alarmSnooze}
        </button>
      )}
      <button className="btn-quiet btn-wide" onClick={() => dispatch({ type: "alarmClose" })}>
        {MED.alarmClose}
      </button>
    </section>
  );
}

// 薬の設定・薬を足す・頓服を足す・頓服を飲んだ・主治医に伝えるメモ（どれも全画面のシート）
export function MedSheet({ state, dispatch }: Props) {
  const v = state.medView;
  if (!v) return null;
  const close = () => dispatch({ type: "medOpen", view: null });
  const toSettings = () => dispatch({ type: "medOpen", view: { kind: "settings" } });
  let title = "";
  let body = null;
  if (v.kind === "settings") {
    title = MED.settingsTitle;
    body = <Settings state={state} dispatch={dispatch} />;
  } else if (v.kind === "med") {
    const from = v.from ? state.meds.find((m) => m.id === v.from) : undefined;
    title = from ? MED.switchTitle : v.id ? MED.medFormEdit : MED.medFormTitle;
    body = (
      <MedForm
        key={v.id ?? v.from ?? "new"}
        med={state.meds.find((m) => m.id === v.id) ?? null}
        from={from}
        dispatch={dispatch}
        onCancel={toSettings}
      />
    );
  } else if (v.kind === "prn") {
    const from = v.from ? state.prnMeds.find((m) => m.id === v.from) : undefined;
    title = from ? MED.switchTitle : v.id ? MED.prnFormEdit : MED.prnFormTitle;
    body = (
      <PrnForm
        key={v.id ?? v.from ?? "new"}
        prn={state.prnMeds.find((m) => m.id === v.id) ?? null}
        from={from}
        dispatch={dispatch}
        onCancel={toSettings}
      />
    );
  } else if (v.kind === "prnTake") {
    title = MED.prnTakeTitle;
    body = <PrnTake key={v.id} id={v.id} state={state} dispatch={dispatch} />;
  } else {
    title = MED.memoTitle;
    body = <DoctorMemo state={state} dispatch={dispatch} />;
  }
  // 足す・変えるの画面を閉じたら、設定に戻る
  const back = v.kind === "med" || v.kind === "prn" ? toSettings : close;
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet-body">
        <div className="sheet-head">
          <h1 className="page-title">{title}</h1>
          <button className="link-small" onClick={back}>
            ×{MED.close}
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}

function Settings({ state, dispatch }: Props) {
  // 飲む時間の早い順に並べる（別の薬に変えても、並びが変わらないように）
  const meds = state.meds.filter((m) => !m.ended).sort((a, b) => (a.times[0]?.at ?? "").localeCompare(b.times[0]?.at ?? ""));
  const prns = state.prnMeds.filter((p) => !p.ended);
  const ended = [...state.meds, ...state.prnMeds].filter((m) => m.ended);
  const alarm = state.alarm;
  return (
    <>
      <p className="muted">{MED.settingsNote}</p>

      {(meds.length > 0 || prns.length > 0) && (
        <details className="card card-quiet">
          <summary>{MED.changeHelpTitle}</summary>
          <ul className="list-plain">
            {MED.changeHelp.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </details>
      )}

      <section className="card">
        <h2>{MED.dailyTitle}</h2>
        {meds.map((m) => (
          <div key={m.id} className="med-item">
            <p className="med-item-head">
              <span className="med-name">💊 {m.label}</span>
            </p>
            <p className="muted med-sub">
              {[
                m.name,
                MED.daily,
                m.times[0]?.amount ? MED.perTime(m.times[0].amount) : "",
                m.stock !== null ? MED.stockLeft(m.stock) : "",
                m.memo ? MED.memoIs(m.memo) : "",
              ]
                .filter(Boolean)
                .join("・")}
            </p>
            <div className="chips">
              {m.times.map((t) => (
                <button
                  key={t.at}
                  className="chip"
                  aria-pressed={t.alarm}
                  onClick={() => dispatch({ type: "toggleMedTime", medId: m.id, at: t.at })}
                >
                  {t.at} {t.alarm ? MED.alarmOn : MED.alarmOff}
                </button>
              ))}
            </div>
            <MedActions id={m.id} label={m.label} kind="med" dispatch={dispatch} />
          </div>
        ))}
        <button className="btn-outline btn-wide" onClick={() => dispatch({ type: "medOpen", view: { kind: "med", id: null } })}>
          {MED.addMed}
        </button>
        <p className="muted">{MED.addMedNote}</p>
      </section>

      <section className="card">
        <h2>{MED.prnTitle}</h2>
        {prns.map((p) => (
          <div key={p.id} className="med-item">
            <p className="med-item-head">
              <span className="med-name">💊 {p.label}</span>
            </p>
            <p className="muted med-sub">{MED.prnSummary(p)}</p>
            <MedActions id={p.id} label={p.label} kind="prn" dispatch={dispatch} />
          </div>
        ))}
        <button className="btn-outline btn-wide" onClick={() => dispatch({ type: "medOpen", view: { kind: "prn", id: null } })}>
          {MED.addPrn}
        </button>
        <p className="muted">{MED.prnNote}</p>
      </section>

      <section className="card">
        <h2>{MED.alarmTitleSet}</h2>
        <Toggle label={MED.alarmOnLabel} on={alarm.on} onChange={(on) => dispatch({ type: "setAlarm", alarm: { on } })} />
        <Toggle label={MED.alarmSound} on={alarm.sound} onChange={(sound) => dispatch({ type: "setAlarm", alarm: { sound } })} />
        <Toggle
          label={MED.alarmOnlyIf}
          on={alarm.onlyIfNotTaken}
          onChange={(onlyIfNotTaken) => dispatch({ type: "setAlarm", alarm: { onlyIfNotTaken } })}
        />
        <Toggle
          label={MED.alarmVisit}
          on={alarm.visit !== false}
          onChange={(visit) => dispatch({ type: "setAlarm", alarm: { visit } })}
        />
        <Toggle label={MED.alarmDevice} on={alarm.device} onChange={(device) => dispatch({ type: "setAlarm", alarm: { device } })} />
        <p className="muted">{MED.alarmDeviceNote}</p>
      </section>

      <section className="card">
        <h2>{MED.visitTitle}</h2>
        <input
          type="date"
          className="input-wide"
          value={state.nextVisit ?? ""}
          onChange={(e) => dispatch({ type: "setNextVisit", date: e.target.value || null })}
        />
        <p className="muted">{MED.visitNote}</p>
        {state.nextVisit && (
          <button className="link-small link-muted" onClick={() => dispatch({ type: "visitDemo" })}>
            {state.visitDemo ? MED.visitDemoOff : MED.visitDemo}
          </button>
        )}
      </section>

      {ended.length > 0 && (
        <details className="card card-quiet">
          <summary>{MED.endedTitle}</summary>
          <ul className="list-plain">
            {ended.map((m) => (
              <li key={m.id}>
                {m.label}
                <span className="muted">（{MED.endedAt(jpDate(m.ended!))}）</span>{" "}
                <button className="link-small" onClick={() => dispatch({ type: "medRestart", id: m.id })}>
                  {MED.restart}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {meds.length === 0 && prns.length === 0 && (
        <button className="link-small link-muted" onClick={() => dispatch({ type: "medSample" })}>
          {MED.sample}
        </button>
      )}
    </>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function MedForm({ med, from, dispatch, onCancel }: { med: Med | null; from?: Med; dispatch: Dispatch<Action>; onCancel: () => void }) {
  // 別の薬に変わったときは、前の薬の呼び名・時間・メモを引き継ぐ（名前と残りは新しく）
  const base = med ?? from ?? null;
  const [label, setLabel] = useState(base?.label ?? "");
  const [name, setName] = useState(med?.name ?? "");
  const [times, setTimes] = useState(base?.times ?? [{ at: "09:00", alarm: true, amount: 1 }]);
  const [alarm, setAlarm] = useState(base ? base.times.some((t) => t.alarm) : true);
  const [stock, setStock] = useState(med?.stock?.toString() ?? "");
  const [memo, setMemo] = useState(base?.memo ?? "");
  const defaults = ["09:00", "21:00", "13:00", "17:00"];
  const setCount = (n: number) =>
    setTimes(
      Array.from({ length: n }, (_, i) => times[i] ?? { at: [...defaults].sort()[i] ?? "12:00", alarm, amount: 1 }).sort((a, b) =>
        a.at.localeCompare(b.at),
      ),
    );
  const save = () =>
    dispatch({
      type: "medSave",
      replaces: from?.id,
      med: {
        id: med?.id ?? newId("m"),
        label: label.trim(),
        name: name.trim(),
        times: times.map((t) => ({ ...t, alarm })),
        stock: stock.trim() === "" ? null : Math.max(0, Number(stock) || 0),
        memo: memo.trim(),
        ended: null,
      },
    });
  return (
    <>
      {from && <p className="muted">{MED.switchNote(from.label)}</p>}
      <section className="card">
        <p className="path-group">{MED.secMed}</p>
        <label className="field">
          {MED.label}
          <input value={label} placeholder={MED.labelPh} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="field">
          {MED.name}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <p className="muted">{MED.nameNote}</p>
      </section>

      <section className="card">
        <p className="path-group">{MED.secWhen}</p>
        <p className="field-label">{MED.freq}</p>
        <div className="chips">
          <button className="chip" aria-pressed>
            {MED.daily}
          </button>
          {!med && (
            <button className="chip" onClick={() => dispatch({ type: "medOpen", view: { kind: "prn", id: null } })}>
              {MED.freqPrn}
            </button>
          )}
        </div>
        <p className="field-label">{MED.count}</p>
        <div className="chips">
          {[1, 2, 3, 4].map((n) => (
            <button key={n} className="chip" aria-pressed={times.length === n} onClick={() => setCount(n)}>
              {MED.countN(n)}
            </button>
          ))}
        </div>
        {times.map((t, i) => (
          <div key={i} className="med-time-row">
            <input
              type="time"
              value={t.at}
              onChange={(e) => setTimes(times.map((x, j) => (j === i ? { ...x, at: e.target.value } : x)))}
            />
            <span className="muted">{MED.amountPer}</span>
            <input
              type="number"
              min={0}
              className="input-num"
              value={t.amount ?? ""}
              onChange={(e) =>
                setTimes(times.map((x, j) => (j === i ? { ...x, amount: e.target.value === "" ? null : Number(e.target.value) } : x)))
              }
            />
            <span className="muted">{MED.tablets}</span>
          </div>
        ))}
        <p className="muted">{MED.timeNote}</p>
      </section>

      <section className="card">
        <p className="path-group">{MED.secAlarm}</p>
        <Toggle label={MED.alarmThis} on={alarm} onChange={setAlarm} />
      </section>

      <section className="card">
        <p className="path-group">{MED.secStock}</p>
        <div className="med-time-row">
          <span className="muted">{MED.stockNow}</span>
          <input type="number" min={0} className="input-num" value={stock} onChange={(e) => setStock(e.target.value)} />
          <span className="muted">{MED.tablets}</span>
        </div>
        <p className="muted">{MED.stockNote}</p>
        <label className="field">
          {MED.memo}
          <input value={memo} placeholder={MED.memoPh} onChange={(e) => setMemo(e.target.value)} />
        </label>
      </section>

      <div className="confirm-actions">
        <button className="btn-primary" disabled={label.trim() === "" || times.some((t) => !t.at)} onClick={save}>
          {MED.save}
        </button>
        <button className="btn-quiet" onClick={onCancel}>
          {MED.cancel}
        </button>
      </div>
      {med && (
        <section className="card card-quiet-box">
          <p className="muted">{MED.endNote}</p>
          <button className="link-small" onClick={() => dispatch({ type: "medEnd", id: med.id })}>
            {MED.endMed}
          </button>
        </section>
      )}
    </>
  );
}

function PrnForm({ prn, from, dispatch, onCancel }: { prn: PrnMed | null; from?: PrnMed; dispatch: Dispatch<Action>; onCancel: () => void }) {
  // 別の頓服に変わったときは、呼び名と理由だけ引き継ぐ（間隔・上限は新しい薬の指示を入れる）
  const [label, setLabel] = useState(prn?.label ?? from?.label ?? "");
  const [name, setName] = useState(prn?.name ?? "");
  const [amount, setAmount] = useState(prn?.amount?.toString() ?? "1");
  const [interval, setInterval] = useState<number | null>(prn?.intervalHours ?? null);
  const [max, setMax] = useState<number | null | "none">(prn ? prn.maxPerDay : null);
  const [reasons, setReasons] = useState<string[]>(prn?.reasons ?? from?.reasons ?? [...PRN_REASONS]);
  const [extra, setExtra] = useState("");
  const [toMemo, setToMemo] = useState(prn?.toMemo ?? true);
  const [stock, setStock] = useState(prn?.stock?.toString() ?? "");
  const allReasons = [...new Set([...PRN_REASONS, ...reasons])];
  const save = () =>
    dispatch({
      type: "prnSave",
      replaces: from?.id,
      prn: {
        id: prn?.id ?? newId("p"),
        label: label.trim(),
        name: name.trim(),
        amount: amount.trim() === "" ? null : Number(amount) || null,
        intervalHours: interval,
        maxPerDay: max === "none" ? null : max,
        reasons,
        toMemo,
        stock: stock.trim() === "" ? null : Math.max(0, Number(stock) || 0),
        ended: null,
      },
    });
  return (
    <>
      {from && <p className="muted">{MED.switchNote(from.label)}</p>}
      <section className="card">
        <p className="path-group">{MED.secMed}</p>
        <label className="field">
          {MED.label}
          <input value={label} placeholder={MED.prnLabelPh} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="field">
          {MED.name}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </section>

      <section className="card">
        <p className="path-group">{MED.secUse}</p>
        <div className="med-time-row">
          <span className="muted">{MED.amount}</span>
          <input type="number" min={0} className="input-num" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <span className="muted">{MED.tablets}</span>
        </div>
        <p className="field-label">{MED.interval}</p>
        <div className="chips">
          {[4, 6, 8, 12].map((h) => (
            <button key={h} className="chip" aria-pressed={interval === h} onClick={() => setInterval(interval === h ? null : h)}>
              {MED.intervalN(h)}
            </button>
          ))}
        </div>
        <p className="muted">{MED.intervalNote}</p>
        <p className="field-label">{MED.maxDay}</p>
        <div className="chips">
          {[1, 2, 3].map((n) => (
            <button key={n} className="chip" aria-pressed={max === n} onClick={() => setMax(max === n ? null : n)}>
              {MED.maxN(n)}
            </button>
          ))}
          <button className="chip" aria-pressed={max === "none"} onClick={() => setMax(max === "none" ? null : "none")}>
            {MED.noDecide}
          </button>
        </div>
        <p className="muted">{MED.maxNote}</p>
        <p className="field-label">{MED.reasons}</p>
        <div className="chips">
          {allReasons.map((r) => (
            <button
              key={r}
              className="chip"
              aria-pressed={reasons.includes(r)}
              onClick={() => setReasons(reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r])}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="med-time-row">
          <input value={extra} placeholder={MED.reasonAdd} onChange={(e) => setExtra(e.target.value)} />
          <button
            className="btn-outline btn-small"
            disabled={extra.trim() === ""}
            onClick={() => {
              setReasons([...new Set([...reasons, extra.trim()])]);
              setExtra("");
            }}
          >
            ＋
          </button>
        </div>
        <Toggle label={MED.toMemo} on={toMemo} onChange={setToMemo} />
      </section>

      <section className="card">
        <p className="path-group">{MED.secPrnStock}</p>
        <div className="med-time-row">
          <span className="muted">{MED.stockNow}</span>
          <input type="number" min={0} className="input-num" value={stock} onChange={(e) => setStock(e.target.value)} />
          <span className="muted">{MED.tablets}</span>
        </div>
        <p className="muted">{MED.stockNote}</p>
      </section>

      <div className="confirm-actions">
        <button className="btn-primary" disabled={label.trim() === ""} onClick={save}>
          {MED.save}
        </button>
        <button className="btn-quiet" onClick={onCancel}>
          {MED.cancel}
        </button>
      </div>
      {prn && (
        <section className="card card-quiet-box">
          <p className="muted">{MED.endNote}</p>
          <button className="link-small" onClick={() => dispatch({ type: "prnEnd", id: prn.id })}>
            {MED.endPrn}
          </button>
        </section>
      )}
    </>
  );
}

// 頓服を飲んだ。前回からの時間・設定した間隔と上限・きょう何回目かを、事実として並べるだけ。止めない・警告しない
function PrnTake({ id, state, dispatch }: { id: string } & Props) {
  const prn = state.prnMeds.find((p) => p.id === id);
  const [time, setTime] = useState(nowHm());
  const [reason, setReason] = useState<string | null>(null);
  if (!prn) return null;
  const last = prnLast(state, prn.id);
  return (
    <>
      <section className="card">
        <h2>{MED.prnOf(prn.label)}</h2>
        <label className="field">
          {MED.takenTime}
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <p className="muted">
          {MED.prnFacts({
            last: last ? `${last.when}（${last.ago}）` : null,
            interval: prn.intervalHours,
            max: prn.maxPerDay,
            before: prnTodayCount(state, prn.id),
          })}
        </p>
        {prn.reasons.length > 0 && (
          <>
            <p className="field-label">{MED.reasonPick}</p>
            <div className="chips">
              {prn.reasons.map((r) => (
                <button key={r} className="chip" aria-pressed={reason === r} onClick={() => setReason(reason === r ? null : r)}>
                  {r}
                </button>
              ))}
            </div>
          </>
        )}
        <button
          className="btn-primary btn-wide"
          disabled={!time}
          onClick={() => dispatch({ type: "prnTake", prnId: prn.id, time, reason })}
        >
          {MED.keep}
        </button>
      </section>
      <p className="muted">{MED.prnTakeNote}</p>
    </>
  );
}

// 主治医に伝えるメモ。気になることを選ぶとメモに入るだけ。アプリは何も返さない
export function WorryChips({ state, dispatch }: Props) {
  return (
    <div className="chips">
      {(Object.keys(MED.worries) as DoctorMemoKind[]).map((k) => (
        <button
          key={k}
          className="chip"
          aria-pressed={state.doctorMemo.some((d) => d.date === DEMO_TODAY && d.kind === k)}
          onClick={() => dispatch({ type: "doctorMemoToggle", kind: k })}
        >
          {MED.worries[k]}
        </button>
      ))}
    </div>
  );
}

function DoctorMemo({ state, dispatch }: Props) {
  const memos = [...state.doctorMemo].sort((a, b) => b.date.localeCompare(a.date));
  const week = prnWeek(state);
  return (
    <>
      <p className="muted">{MED.memoNote}</p>
      {state.nextVisit && <p className="med-visit">{MED.nextVisit(jpDate(state.nextVisit))}</p>}
      <section className="card">
        <h2>{MED.worryTitle}</h2>
        <p className="muted">{MED.worryNote}</p>
        <WorryChips state={state} dispatch={dispatch} />
      </section>
      <section className="card">
        <h2>{MED.memoListTitle}</h2>
        {memos.length === 0 ? (
          <p className="muted">{MED.memoEmpty}</p>
        ) : (
          <ul className="list-plain">
            {memos.map((m) => (
              <li key={`${m.date}-${m.kind}`}>
                <span className="muted">{jpDate(m.date)}</span> {MED.worries[m.kind]}
              </li>
            ))}
          </ul>
        )}
      </section>
      {week.length > 0 && (
        <section className="card">
          <h2>{MED.prnWeekTitle}</h2>
          <ul className="list-plain">
            {week.map((l, i) => (
              <li key={i}>
                <span className="muted">
                  {jpDate(l.date)} {l.time}
                </span>{" "}
                {l.label}
                {l.reason ? `（${l.reason}）` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// 通院の前の日と当日に、ホームの上に出す知らせ。閉じたら、その日はもう出さない
export function VisitAlert({ state, dispatch }: Props) {
  const d = daysToVisit(state);
  if (d === null || d > 1 || state.alarm.visit === false || state.visitClosed === DEMO_TODAY || !state.nextVisit) return null;
  return (
    <section className="alarm-panel visit-alert" role="status">
      <p className="alarm-title">{d === 0 ? MED.visitToday : MED.visitTomorrow}</p>
      <p className="muted">{MED.visitAlertNote}</p>
      <button className="btn-outline btn-wide" onClick={() => dispatch({ type: "medOpen", view: { kind: "memo" } })}>
        {MED.memoLink} ›
      </button>
      <button className="btn-quiet btn-wide" onClick={() => dispatch({ type: "visitClose" })}>
        {MED.alarmClose}
      </button>
    </section>
  );
}

// ホームの上に出す、薬のアラームと通院の知らせ（どの段階でも）
export function MedTop({ state, dispatch }: Props) {
  return (
    <>
      <AlarmPanel state={state} dispatch={dispatch} />
      <VisitAlert state={state} dispatch={dispatch} />
    </>
  );
}

// 回復期から先のホームの下に置く、薬の設定への入口（量や種類が変わったとき用）
export function MedEditLink({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <p className="med-edit-link">
      <button className="link-small link-muted" onClick={() => dispatch({ type: "medOpen", view: { kind: "settings" } })}>
        💊 {MED.editLink} ›
      </button>
    </p>
  );
}

// 薬ごとの入口：量・時間を変える／別の薬に変わった／服薬終了／もらった分を足す
function MedActions({ id, label, kind, dispatch }: { id: string; label: string; kind: "med" | "prn"; dispatch: Dispatch<Action> }) {
  const [refill, setRefill] = useState(false);
  const [n, setN] = useState("");
  return (
    <div className="med-actions">
      <div className="med-action-row">
        <button className="btn-outline btn-small" onClick={() => dispatch({ type: "medOpen", view: { kind, id } })}>
          {MED.editAmount}
        </button>
        <button className="btn-outline btn-small" onClick={() => dispatch({ type: "medOpen", view: { kind, id: null, from: id } })}>
          {MED.switchMed}
        </button>
        <ConfirmButton
          quiet
          modal
          label={MED.endShort}
          confirm={MED.endConfirm(label)}
          yes={MED.endYes}
          no={MED.cancel}
          onConfirm={() => dispatch({ type: kind === "med" ? "medEnd" : "prnEnd", id })}
        />
      </div>
      {refill ? (
        <div className="med-time-row">
          <input type="number" min={1} className="input-num" value={n} autoFocus onChange={(e) => setN(e.target.value)} />
          <span className="muted">{MED.tablets}</span>
          <button
            className="btn-outline btn-small"
            disabled={!(Number(n) > 0)}
            onClick={() => {
              dispatch({ type: "medRefill", id, n: Number(n) });
              setRefill(false);
              setN("");
            }}
          >
            {MED.refillAdd}
          </button>
          <button className="btn-quiet btn-small" onClick={() => setRefill(false)}>
            {MED.cancel}
          </button>
        </div>
      ) : (
        <button className="link-small" onClick={() => setRefill(true)}>
          ＋{MED.refill}
        </button>
      )}
    </div>
  );
}
