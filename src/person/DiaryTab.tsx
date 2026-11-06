import { useRef, useState, type Dispatch, type ReactNode } from "react";
import { RECORD, type Meal, type SleepQuality } from "../constants/labels";
import { DEMO_TODAY, emptyEntry, lastSevenDays, type DiaryEntry } from "../data/demo";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

const SLEEP: SleepQuality[] = ["good", "normal", "poor"];
const MEALS: Meal[] = ["morning", "noon", "night"];
const MOOD_SCORES = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
const FOCUS = [1, 2, 3, 4, 5];

// 今日の記録。段階ごとに目的と項目を変える。どれも任意
// 急性期：選ぶだけ（生きているだけでいい）。「今日は書かない」も選べる
// 回復期・準備期：タップの項目を上に、書く欄は「もう少し書く」にたたむ
function withLastTimes(diary: Record<string, DiaryEntry>): DiaryEntry {
  const last = Object.keys(diary)
    .filter((d) => d < DEMO_TODAY)
    .sort()
    .reverse()
    .map((d) => diary[d])
    .find((e) => e.wake || e.sleep);
  return { ...emptyEntry(), wake: last?.wake ?? "", sleep: last?.sleep ?? "" };
}

const hasWriting = (e: DiaryEntry) => Boolean(e.moodReason || e.stressCoping || e.workIdea || e.note);

export default function DiaryTab({ state, dispatch }: Props) {
  const saved = state.diary[DEMO_TODAY];
  const acute = state.stage === "acute";
  // 時刻は、前の日に書いたものを最初から入れておく（同じなら触らずに済む）
  const [entry, setEntry] = useState<DiaryEntry>(saved ?? withLastTimes(state.diary));
  const [editing, setEditing] = useState(!saved);
  const [thanks, setThanks] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [more, setMore] = useState(saved ? hasWriting(saved) : false);

  const set = <K extends keyof DiaryEntry>(key: K, value: DiaryEntry[K]) => setEntry((e) => ({ ...e, [key]: value }));
  const toggle = <K extends keyof DiaryEntry>(key: K, value: DiaryEntry[K]) =>
    setEntry((e) => ({ ...e, [key]: e[key] === value ? null : value }));

  const save = () => {
    dispatch({ type: "saveDiary", entry });
    setThanks(RECORD.thanks[Math.floor(Math.random() * RECORD.thanks.length)]);
    setEditing(false);
  };

  // 記録を残したあと、下のナビを探さなくてもホームに戻れるようにする
  const goHome = () => dispatch({ type: "setTab", tab: "home" });
  const aim = RECORD.aim[state.stage];

  return (
    <div className="home">
      <div className="page-head">
        <h1 className="page-title">{RECORD.title}</h1>
        <button className="btn-quiet page-close" onClick={goHome} aria-label={RECORD.backHome}>
          ✕ {RECORD.close}
        </button>
      </div>
      {aim && <p className="diary-aim">{aim}</p>}
      <p className="muted">{RECORD.privacy}</p>

      {skipped ? (
        <section className="card">
          <p className="thanks">{RECORD.skipped}</p>
          <button className="btn-primary btn-wide" onClick={goHome}>
            {RECORD.backHome}
          </button>
          <button className="btn-quiet" onClick={() => setSkipped(false)}>
            {RECORD.skipUndo}
          </button>
        </section>
      ) : !editing ? (
        <section className="card">
          {thanks && <p className="thanks">{thanks}</p>}
          <DiarySummary entry={state.diary[DEMO_TODAY] ?? entry} />
          {thanks && (
            <button className="btn-primary btn-wide" onClick={goHome}>
              {RECORD.backHome}
            </button>
          )}
          <button className="btn-quiet" onClick={() => setEditing(true)}>
            {RECORD.edit}
          </button>
        </section>
      ) : (
        <section className="card diary-form">
          {acute && !saved && (
            <button className="btn-outline btn-wide diary-skip" onClick={() => setSkipped(true)}>
              {RECORD.skip}
            </button>
          )}
          <div className="row2">
            <label className="field">
              {RECORD.sleep}
              <input type="time" value={entry.sleep} onChange={(e) => set("sleep", e.target.value)} />
            </label>
            <label className="field">
              {RECORD.wake}
              <input type="time" value={entry.wake} onChange={(e) => set("wake", e.target.value)} />
            </label>
          </div>

          <fieldset>
            <legend>{RECORD.sleepQuality}</legend>
            <div className="chips chips-even">
              {SLEEP.map((s) => (
                <Chip key={s} on={entry.sleepQuality === s} onClick={() => toggle("sleepQuality", s)}>
                  {RECORD.sleepQualityOptions[s]}
                </Chip>
              ))}
            </div>
          </fieldset>

          {!acute && (
            <fieldset>
              <legend>{RECORD.nap}</legend>
              <div className="chips chips-even">
                {RECORD.napOptions.map((n) => (
                  <Chip key={n} on={entry.nap === n} onClick={() => toggle("nap", n)}>
                    {RECORD.napLabel(n)}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend>{RECORD.meals}</legend>
            <div className="chips">
              {MEALS.map((m) => (
                <Chip
                  key={m}
                  on={entry.meals.includes(m)}
                  onClick={() =>
                    set("meals", entry.meals.includes(m) ? entry.meals.filter((x) => x !== m) : [...entry.meals, m])
                  }
                >
                  {RECORD.mealOptions[m]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>{RECORD.activity}</legend>
            <div className="chips">
              <Chip on={entry.activity === true} onClick={() => toggle("activity", true)}>
                {RECORD.activityYes}
              </Chip>
              <Chip
                on={entry.activity === false}
                onClick={() => setEntry((e) => ({ ...e, activity: e.activity === false ? null : false, activityMinutes: null }))}
              >
                {RECORD.activityNo}
              </Chip>
            </div>
            {entry.activity && (
              <div className="chips chips-sub">
                {RECORD.activityMinutes.map((n) => (
                  <Chip key={n} on={entry.activityMinutes === n} onClick={() => toggle("activityMinutes", n)}>
                    {RECORD.minutes(n)}
                  </Chip>
                ))}
              </div>
            )}
          </fieldset>

          {!acute && (
            <fieldset>
              <legend>{RECORD.active}</legend>
              <div className="chips chips-even">
                {RECORD.activeOptions.map((h) => (
                  <Chip key={h} on={entry.activeHours === h} onClick={() => toggle("activeHours", h)}>
                    {RECORD.activeHours(h)}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}

          {!acute && (
            <fieldset>
              <legend>{RECORD.focus}</legend>
              <div className="scale">
                {FOCUS.map((n) => (
                  <button key={n} className="scale-btn" aria-pressed={entry.focus === n} onClick={() => toggle("focus", n)}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="face-ends" aria-hidden="true">
                <span>{RECORD.focusEnds[0]}</span>
                <span>{RECORD.focusEnds[1]}</span>
              </div>
            </fieldset>
          )}

          {acute ? (
            <fieldset>
              <legend>{RECORD.mood}</legend>
              <div className="faces">
                {RECORD.moodFaces.map((f, i) => (
                  <button
                    key={f}
                    className="face"
                    aria-pressed={entry.mood === i}
                    aria-label={`${RECORD.mood} ${i + 1}`}
                    onClick={() => toggle("mood", i)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="face-ends" aria-hidden="true">
                <span>{RECORD.moodEnds[0]}</span>
                <span>{RECORD.moodEnds[1]}</span>
              </div>
            </fieldset>
          ) : (
            <fieldset>
              <legend>{RECORD.moodScore}</legend>
              <div className="scale scale-11">
                {MOOD_SCORES.map((n) => (
                  <button key={n} className="scale-btn" aria-pressed={entry.moodScore === n} onClick={() => toggle("moodScore", n)}>
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>
              <div className="face-ends" aria-hidden="true">
                <span>{RECORD.moodScoreEnds[0]}</span>
                <span>{RECORD.moodScoreEnds[1]}</span>
              </div>
            </fieldset>
          )}

          {!acute && (
            <fieldset>
              <legend>{RECORD.stress}</legend>
              <div className="chips">
                {RECORD.stressOptions.map((s) => {
                  const list = entry.stress ?? [];
                  const none = RECORD.stressOptions[RECORD.stressOptions.length - 1];
                  return (
                    <Chip
                      key={s}
                      on={list.includes(s)}
                      onClick={() =>
                        set(
                          "stress",
                          list.includes(s) ? list.filter((x) => x !== s) : s === none ? [s] : [...list.filter((x) => x !== none), s],
                        )
                      }
                    >
                      {s}
                    </Chip>
                  );
                })}
              </div>
            </fieldset>
          )}

          {!acute && (
            <div className="diary-more">
              <button className="btn-quiet" aria-expanded={more} onClick={() => setMore((m) => !m)}>
                {more ? `▲ ${RECORD.moreClose}` : `▼ ${RECORD.more}`}
              </button>
              {more && (
                <>
                  <TextField label={RECORD.moodReason} value={entry.moodReason ?? ""} onChange={(v) => set("moodReason", v)} />
                  <TextField label={RECORD.stressCoping} value={entry.stressCoping ?? ""} onChange={(v) => set("stressCoping", v)} />
                  <TextField label={RECORD.workIdea} value={entry.workIdea ?? ""} onChange={(v) => set("workIdea", v)} />
                  <TextField
                    label={state.stage === "preReturn" ? RECORD.notePreReturn : RECORD.noteRecovery}
                    value={entry.note}
                    onChange={(v) => set("note", v)}
                  />
                  <VoiceInput onText={(t) => setEntry((e) => ({ ...e, note: e.note ? `${e.note} ${t}` : t }))} />
                </>
              )}
            </div>
          )}

          <button className="btn-primary btn-wide" onClick={save}>
            {RECORD.save}
          </button>
        </section>
      )}

      <WeekStrip diary={state.diary} />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      {label}
      <textarea rows={2} value={value} placeholder={RECORD.notePlaceholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

function DiarySummary({ entry }: { entry: DiaryEntry }) {
  const parts = [
    entry.sleep && `${RECORD.sleep} ${entry.sleep}`,
    entry.wake && `${RECORD.wake} ${entry.wake}`,
    entry.sleepQuality && `${RECORD.sleepQuality}：${RECORD.sleepQualityOptions[entry.sleepQuality]}`,
    entry.nap != null && `${RECORD.nap}：${RECORD.napLabel(entry.nap)}`,
    entry.meals.length > 0 && `${RECORD.meals}：${MEALS.filter((m) => entry.meals.includes(m)).map((m) => RECORD.mealOptions[m]).join("・")}`,
    entry.activity !== null &&
      `${RECORD.activity}：${entry.activity ? RECORD.activityYes : RECORD.activityNo}${entry.activityMinutes ? `（${RECORD.minutes(entry.activityMinutes)}）` : ""}`,
    entry.activeHours !== null && `${RECORD.active}：${RECORD.activeHours(entry.activeHours)}`,
    entry.focus != null && `${RECORD.focus}：${entry.focus}／5`,
    entry.moodScore != null && `${RECORD.mood}：${entry.moodScore > 0 ? `+${entry.moodScore}` : entry.moodScore}`,
    entry.stress && entry.stress.length > 0 && `${RECORD.stress.replace(/（.*）/, "")}：${entry.stress.join("・")}`,
  ].filter(Boolean) as string[];
  const writings = [
    [RECORD.moodReason, entry.moodReason],
    [RECORD.stressCoping, entry.stressCoping],
    [RECORD.workIdea, entry.workIdea],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div className="diary-summary">
      {entry.mood !== null && <span className="face-big">{RECORD.moodFaces[entry.mood]}</span>}
      <ul className="list-plain">
        {parts.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {writings.map(([k, v]) => (
        <p key={k} className="note-quote">
          <span className="muted">{k}：</span>
          {v}
        </p>
      ))}
      {entry.note && <p className="note-quote">{entry.note}</p>}
    </div>
  );
}

// 書けなかった日は空欄のまま。×や警告色は使わない
function WeekStrip({ diary }: { diary: Record<string, DiaryEntry> }) {
  return (
    <section className="card">
      <h2>{RECORD.weekTitle}</h2>
      <div className="week">
        {lastSevenDays().map((d) => {
          const date = new Date(`${d}T00:00:00`);
          const filled = Boolean(diary[d]);
          return (
            <div key={d} className="week-day">
              <span className="muted">{RECORD.weekdays[date.getDay()]}</span>
              <span className={filled ? "week-dot week-dot-on" : "week-dot"} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ブラウザの音声入力を使う。使えないブラウザでは、ボタンを出さない
type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
};

function VoiceInput({ onText }: { onText: (t: string) => void }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;

  const start = () => {
    const rec = new Ctor();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <button className="btn-quiet btn-voice" onClick={start} disabled={listening}>
      🎙 {listening ? RECORD.voiceListening : RECORD.voice}
    </button>
  );
}
