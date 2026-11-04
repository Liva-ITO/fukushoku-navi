import { useRef, useState, type Dispatch, type ReactNode } from "react";
import { RECORD, type Meal, type SleepQuality } from "../constants/labels";
import { DEMO_TODAY, emptyEntry, lastSevenDays, type DiaryEntry } from "../data/demo";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

const SLEEP: SleepQuality[] = ["good", "normal", "poor"];
const MEALS: Meal[] = ["morning", "noon", "night"];

// 今日の記録。タップ中心で、1分以内に終わること。点数や評価はつけない
function withLastTimes(diary: Record<string, DiaryEntry>): DiaryEntry {
  const last = Object.keys(diary)
    .filter((d) => d < DEMO_TODAY)
    .sort()
    .reverse()
    .map((d) => diary[d])
    .find((e) => e.wake || e.sleep);
  return { ...emptyEntry(), wake: last?.wake ?? "", sleep: last?.sleep ?? "" };
}

export default function DiaryTab({ state, dispatch }: Props) {
  const saved = state.diary[DEMO_TODAY];
  // 時刻は、前の日に書いたものを最初から入れておく（同じなら触らずに済む）
  const [entry, setEntry] = useState<DiaryEntry>(saved ?? withLastTimes(state.diary));
  const [editing, setEditing] = useState(!saved);
  const [thanks, setThanks] = useState<string | null>(null);

  const set = <K extends keyof DiaryEntry>(key: K, value: DiaryEntry[K]) => setEntry((e) => ({ ...e, [key]: value }));

  const save = () => {
    dispatch({ type: "saveDiary", entry });
    setThanks(RECORD.thanks[Math.floor(Math.random() * RECORD.thanks.length)]);
    setEditing(false);
  };

  // 記録を残したあと、下のナビを探さなくてもホームに戻れるようにする
  const goHome = () => dispatch({ type: "setTab", tab: "home" });

  return (
    <div className="home">
      <div className="page-head">
        <h1 className="page-title">{RECORD.title}</h1>
        <button className="btn-quiet page-close" onClick={goHome} aria-label={RECORD.backHome}>
          ✕ {RECORD.close}
        </button>
      </div>
      <p className="muted">{RECORD.privacy}</p>

      {!editing ? (
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
          <div className="row2">
            <label className="field">
              {RECORD.wake}
              <input type="time" value={entry.wake} onChange={(e) => set("wake", e.target.value)} />
            </label>
            <label className="field">
              {RECORD.sleep}
              <input type="time" value={entry.sleep} onChange={(e) => set("sleep", e.target.value)} />
            </label>
          </div>

          <fieldset>
            <legend>{RECORD.sleepQuality}</legend>
            <div className="chips chips-even">
              {SLEEP.map((s) => (
                <Chip key={s} on={entry.sleepQuality === s} onClick={() => set("sleepQuality", entry.sleepQuality === s ? null : s)}>
                  {RECORD.sleepQualityOptions[s]}
                </Chip>
              ))}
            </div>
          </fieldset>

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
              <Chip on={entry.activity === true} onClick={() => set("activity", entry.activity === true ? null : true)}>
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
                  <Chip key={n} on={entry.activityMinutes === n} onClick={() => set("activityMinutes", entry.activityMinutes === n ? null : n)}>
                    {RECORD.minutes(n)}
                  </Chip>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>{RECORD.active}</legend>
            <div className="chips chips-even">
              {RECORD.activeOptions.map((h) => (
                <Chip key={h} on={entry.activeHours === h} onClick={() => set("activeHours", entry.activeHours === h ? null : h)}>
                  {RECORD.activeHours(h)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>{RECORD.mood}</legend>
            <div className="faces">
              {RECORD.moodFaces.map((f, i) => (
                <button
                  key={f}
                  className="face"
                  aria-pressed={entry.mood === i}
                  aria-label={`${RECORD.mood} ${i + 1}`}
                  onClick={() => set("mood", entry.mood === i ? null : i)}
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

          <label className="field">
            {RECORD.note}
            <textarea
              rows={2}
              value={entry.note}
              placeholder={RECORD.notePlaceholder}
              onChange={(e) => set("note", e.target.value)}
            />
          </label>
          <VoiceInput onText={(t) => setEntry((e) => ({ ...e, note: e.note ? `${e.note} ${t}` : t }))} />

          <button className="btn-primary btn-wide" onClick={save}>
            {RECORD.save}
          </button>
        </section>
      )}

      <WeekStrip diary={state.diary} />
    </div>
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
    entry.wake && `${RECORD.wake} ${entry.wake}`,
    entry.sleep && `${RECORD.sleep} ${entry.sleep}`,
    entry.sleepQuality && `${RECORD.sleepQuality}：${RECORD.sleepQualityOptions[entry.sleepQuality]}`,
    entry.meals.length > 0 && `${RECORD.meals}：${MEALS.filter((m) => entry.meals.includes(m)).map((m) => RECORD.mealOptions[m]).join("・")}`,
    entry.activity !== null &&
      `${RECORD.activity}：${entry.activity ? RECORD.activityYes : RECORD.activityNo}${entry.activityMinutes ? `（${RECORD.minutes(entry.activityMinutes)}）` : ""}`,
    entry.activeHours !== null && `${RECORD.active}：${RECORD.activeHours(entry.activeHours)}`,
  ].filter(Boolean) as string[];
  return (
    <div className="diary-summary">
      {entry.mood !== null && <span className="face-big">{RECORD.moodFaces[entry.mood]}</span>}
      <ul className="list-plain">
        {parts.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
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
