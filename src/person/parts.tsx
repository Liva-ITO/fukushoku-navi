import { useState, type Dispatch, type ReactNode } from "react";
import { ACUTE, COMMON, CONSULT, CONTACT, HOME, RECORD } from "../constants/labels";
import { DEMO_TODAY, type HrMessage } from "../data/demo";
import { whoNow, type Action, type MeetingKind, type State } from "../state/store";

// チケットで申し込む相談（急性期と休息モードは心理の専門家、それ以外は復職コーディネーター）。チケットが残っていれば申し込み、なければリクエスト。
// 休息モードでは、チケットがないときはリクエストの代わりに公的な相談窓口を出す
export function CoordinatorCard({
  state,
  dispatch,
  title: titleIn,
  note: noteIn,
  publicWhenEmpty = false,
  showNewLink = true,
  pickHere = false,
}: {
  state: State;
  dispatch: Dispatch<Action>;
  title?: string;
  note?: string;
  publicWhenEmpty?: boolean;
  showNewLink?: boolean;
  pickHere?: boolean; // 日程の候補をここで選べるか（いまは使わない。候補は連絡タブで選ぶ）
}) {
  const hasTickets = state.ticketsLeft > 0;
  const report = state.coordinatorReport;
  // 申し込み中はそのときの相手、これから申し込むならいまの段階の相手
  const pending = state.coordinatorMeeting !== null && report !== "done" && report !== "declined";
  const who = pending ? state.coordWho : whoNow(state);
  const name = CONSULT.who[who];
  const title = titleIn ?? CONSULT.title_[who];
  const note = noteIn ?? CONSULT.note_[who];
  const cs = state.coordSchedule;
  // 面談が済んだ・今回は難しいと連絡があったときは、また申し込める
  const open = state.coordinatorMeeting === null || report === "done" || report === "declined";
  const newLink = showNewLink && !cs?.offerId && <NewNoticeLink state={state} dispatch={dispatch} />;
  // 急性期は、面談は1つずつ。回復期に進む前の、コーディネーターとの面談を申し込んでいるあいだは、こちらは申し込めない
  const psychBusy = state.stage === "acute" && state.rivaMeetingApplied && !state.psychMeetingDone;
  if (publicWhenEmpty && !hasTickets && open) {
    return (
      <section className="card">
        <h2>{title}</h2>
        {newLink}
        <PublicLines />
      </section>
    );
  }
  return (
    <section className="card">
      <h2>{title}</h2>
      {newLink}
      {!open && cs?.chosen && <p className="done-note">{CONSULT.decidedNote(cs.chosen)}</p>}
      {!open && cs?.offerId &&
        (pickHere ? (
          <>
            <p className="done-note">{CONSULT.offerPick}</p>
            <SlotPicker kind="coordinator" state={state} dispatch={dispatch} />
          </>
        ) : (
          <button className="new-link" onClick={() => dispatch({ type: "setTab", tab: "contact" })}>
            {CONSULT.offerGo}
          </button>
        ))}
      {!open && !cs?.chosen && !cs?.offerId && state.coordinatorMeeting === "applied" && <p className="done-note">{CONSULT.applied(name)}</p>}
      {!open && !cs && state.coordinatorMeeting === "requested" && (
        <div className="confirm">
          <p className="done-note">{CONSULT.requestedTitle}</p>
          {CONSULT.requestedLines(name).map((l) => (
            <p key={l} className="muted">
              {l}
            </p>
          ))}
        </div>
      )}
      {open && psychBusy && <p className="muted">{CONSULT.busyPsych}</p>}
      {open && !psychBusy && (
        <>
          <p className="muted">{note}</p>
          <div className="stack">
            <ConfirmButton
              quiet
              modal
              label={hasTickets ? CONSULT.apply : CONSULT.request}
              confirm={hasTickets ? CONSULT.applyConfirm(name) : CONSULT.requestConfirm(name)}
              yes={hasTickets ? CONSULT.applyYes : CONSULT.requestYes}
              no={CONSULT.no}
              onConfirm={() => dispatch({ type: "askCoordinator" })}
            />
          </div>
        </>
      )}
    </section>
  );
}

// 日程の候補から選ぶ。選べるのは、いちばん新しい候補だけ。どちらの操作も確認を挟む
export function SlotPicker({ kind, state, dispatch }: { kind: MeetingKind; state: State; dispatch: Dispatch<Action> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [none, setNone] = useState(false);
  const schedule = kind === "psych" ? state.psychSchedule : state.coordSchedule;
  const offer = state.coordInbox.find((m) => m.id === schedule?.offerId);
  if (!offer?.options) return null;
  if (picked || none)
    return (
      <div className="confirm slot-confirm">
        <p>{picked ? CONSULT.pickConfirm(picked) : CONSULT.noneFitConfirm}</p>
        <div className="confirm-actions">
          <button
            className="btn-primary"
            onClick={() => {
              if (picked) dispatch({ type: "chooseSlot", kind, slot: picked });
              else dispatch({ type: "noneFit", kind });
              setPicked(null);
              setNone(false);
            }}
          >
            {picked ? CONSULT.pickYes : CONSULT.noneFitYes}
          </button>
          <button
            className="btn-quiet"
            onClick={() => {
              setPicked(null);
              setNone(false);
            }}
          >
            {CONSULT.no}
          </button>
        </div>
      </div>
    );
  return (
    <div className="slots">
      {offer.options.map((o) => (
        <button key={o} className="btn-outline slot" onClick={() => setPicked(o)}>
          {o}
        </button>
      ))}
      <button className="btn-outline slot slot-none" onClick={() => setNone(true)}>
        {CONSULT.noneFit}
      </button>
    </div>
  );
}

// ホームの日記の入口。今日書いたかどうかが分かるようにする
export function DiaryEntryCard({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const done = Boolean(state.diary[DEMO_TODAY]);
  return (
    <button className="link-soft diary-entry" onClick={() => dispatch({ type: "setTab", tab: "record" })}>
      <span>
        <span className="diary-entry-title">{HOME.diaryTitle}</span>
        <span className="muted diary-entry-note">
          {done
            ? HOME.diaryDone
            : state.stage === "acute"
              ? state.taps?.date === DEMO_TODAY && state.taps.wake
                ? HOME.diaryNoteWake
                : HOME.diaryNoteAcute
              : HOME.diaryNote}
        </span>
      </span>
    </button>
  );
}

// 支援機関からの新しいお知らせ。見逃さないよう、ホームからも相談タブに行けるようにする
export function NewNoticeLink({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  // 人事からも、コーディネーター・専門家からも、新しいお知らせは「連絡」に届く
  const unread = state.coordInbox.length - state.coordSeen + (state.hrMessages.length - state.personHrSeen);
  if (unread <= 0) return null;
  // 急性期は、数字を出さない（件数が急かすので）
  const quiet = state.stage === "acute";
  return (
    <button className="new-link" onClick={() => dispatch({ type: "setTab", tab: "contact" })}>
      {!quiet && <span className="tab-badge">{unread}</span>}
      {quiet ? CONSULT.newLinkQuiet : CONSULT.newLink(unread)}
    </button>
  );
}

export function PublicLines() {
  return (
    <ul className="list-plain">
      {CONSULT.publicPlaces.map((p) => (
        <li key={p.name}>
          {p.name}
          {p.tel && (
            <>
              {" "}
              <a href={`tel:${p.tel}`}>{p.tel}</a>
            </>
          )}
          <br />
          <span className="muted">{p.note}</span>
        </li>
      ))}
    </ul>
  );
}

// 人事からの連絡は、ホームには件名だけを出す。押すと連絡タブで本文を読む
export function HrNoticeList({ messages, max, dispatch }: { messages: HrMessage[]; max: number; dispatch: Dispatch<Action> }) {
  if (messages.length === 0) return null;
  const latest = [...messages].reverse();
  const shown = latest.slice(0, max);
  const rest = latest.length - shown.length;
  return (
    <section className="card">
      <h2>{CONTACT.inboxTitle}</h2>
      <ul className="notice-list">
        {shown.map((m) => (
          <li key={m.id}>
            <button className="notice-row" onClick={() => dispatch({ type: "openHrMessage", id: m.id, goContact: true })}>
              <span className="notice-title">{m.title}</span>
              <span className="notice-meta">
                {m.date.slice(5).replace("-", "/")}
                {m.noReplyNeeded && <span className="tag-soft">{COMMON.noReplyNeeded}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <button className="notice-more" onClick={() => dispatch({ type: "openHrMessage", id: null, goContact: true })}>
          {CONTACT.more(rest)}
        </button>
      )}
    </section>
  );
}

export function ReadingsCard() {
  return (
    <section className="card">
      <h2>{ACUTE.readingsTitle}</h2>
      <ul className="list-plain">
        {ACUTE.readings.map((r) => (
          <li key={r.title}>
            {r.title}
            <span className="muted">（{RECORD.minutes(r.minutes)}）</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// いきなり申し込みにせず、何が起きるかを見せてから申し込む
export function ConfirmButton(props: {
  label: string;
  note?: string;
  confirm: string;
  yes: string;
  no: string;
  onConfirm: () => void;
  quiet?: boolean;
  modal?: boolean; // 画面の上に重ねて確かめる（面談の申し込みなど）
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (open && props.modal) {
    return (
      <>
        <div className="confirm-entry">
          <button className={props.quiet ? "btn-outline" : "btn-primary"} disabled>
            {props.label}
          </button>
        </div>
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <p>{props.confirm}</p>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  props.onConfirm();
                  setOpen(false);
                }}
              >
                {props.yes}
              </button>
              <button className="btn-quiet" onClick={() => setOpen(false)}>
                {props.no}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (open) {
    return (
      <div className="confirm">
        <p>{props.confirm}</p>
        <div className="confirm-actions">
          <button
            className="btn-primary"
            onClick={() => {
              props.onConfirm();
              setOpen(false);
            }}
          >
            {props.yes}
          </button>
          <button className="btn-quiet" onClick={() => setOpen(false)}>
            {props.no}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="confirm-entry">
      <button className={props.quiet ? "btn-outline" : "btn-primary"} onClick={() => setOpen(true)}>
        {props.label}
      </button>
      {props.note && <p className="muted">{props.note}</p>}
    </div>
  );
}

// 復職コーディネーターとの面談のあと、これからの希望を会社に伝える。選ぶだけ（急性期に書かせない）。選ぶ → 届く文を見る → 送る
// inline：連絡タブで、コーディネーターからのお知らせのすぐ下に出すとき
export function WishCard({ state, dispatch, inline = false }: { state: State; dispatch: Dispatch<Action>; inline?: boolean }) {
  const Box = inline ? "div" : "section";
  const boxClass = inline ? "wish-inline" : "card";
  const [picked, setPicked] = useState<"go" | "rest" | null>(null);
  const [changing, setChanging] = useState(false);

  if (state.nextWish && !changing)
    return (
      <Box className={boxClass}>
        {!inline && <h2>{ACUTE.wishTitle}</h2>}
        <p className="done-note">{ACUTE.wishSent(ACUTE.wishOptions[state.nextWish])}</p>
        <button className="btn-quiet" onClick={() => setChanging(true)}>
          {ACUTE.wishChange}
        </button>
      </Box>
    );

  return (
    <Box className={boxClass}>
      {!inline && <h2>{ACUTE.wishTitle}</h2>}
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
    </Box>
  );
}
