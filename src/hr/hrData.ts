import { CONSULT, HR, INVITE, RECOVERY, STAGE_LABELS, type Stage } from "../constants/labels";
import { DEMO_TODAY, OTHER_PEOPLE, PERSON, daysSince, type HrEvent, type HrTodo } from "../data/demo";
import type { Invited, Schedule, State } from "../state/store";

// 人事画面で使う形にそろえる。デモの本人は本人画面の状態から作り、ほかの人は架空データをそのまま使う
export type HrRow = {
  id: string;
  name: string;
  dept: string;
  stage: Stage;
  leaveStart: string;
  leaveEnd: string;
  rework: string;
  news: number;
  incoming: number; // 本人から届いたもの（連絡・提出・申し込み）の数
  seen: number; // そのうち人事が見た数
  newFrom: number; // 開く前に見ていた数。経緯でこれより後のものに「新着」をつける
  todos: HrTodo[];
  events: HrEvent[];
  live: boolean; // 本人画面と連動しているか
  pending?: boolean; // 招待を送ったが、本人がまだ始めていない
  issues?: string; // 招待のときに入力した、復職に向けた課題（会社の見立て）
  issueNotes: { date: string; text: string }[]; // あとから書き足した見立て
  invite?: { date: string; email: string; resends: { date: string; email: string }[] }; // まだ始めていない人の案内
  rework_?: boolean; // リワークを使っている（見立ての共有の同意を出す）
};

function reworkOf(state: State): string {
  if (state.prepPath === null) return HR.reworkNone;
  if (state.prepPath === "self") return HR.reworkSelf;
  return RECOVERY.pathOptions[state.prepPath].name;
}

// デモの本人の「対応が必要なこと」。申し込みはデモの「今日」に届いたものとして扱う
function todosOf(state: State): HrTodo[] {
  const t: HrTodo[] = [];
  const at = (key: string, text: string) => t.push({ key, text, date: DEMO_TODAY });
  if (state.stage === "acute" && state.psychMeetingDone && state.nextWish) at(`a-wish-${state.sentToHr.length}`, HR.todoA.wishArrived);
  else if (state.stage === "acute" && state.psychMeetingDone) at("a-psych-done", HR.todoA.psychDone);
  // 回復期に進むための面談の申し込みは、人事がすることがないので出さない（段階の欄に状態が出る）
  if (state.companyMeeting?.status === "applied") at("a-company", HR.todoA.companyMeeting);
  // コーディネーターとの面談の申し込みは、人事がすることがないので「対応が必要なこと」に出さない
  if (state.coordinatorMeeting === "requested" && !state.coordinatorReport && !state.coordSchedule) at("a-coord-req", HR.todoA.coordinatorRequested(CONSULT.who[state.coordWho]));
  // 本人からの連絡は、届いた件数ごとに別の項目にする（対応済みのあとに新しく届いたら、また出す）
  if (state.sentToHr.length > state.hrRepliedAt) at(`a-msg-${state.sentToHr.length}`, HR.todoA.newFromPerson(state.sentToHr.length, state.sentToHr[state.sentToHr.length - 1].body));
  return t;
}

function doneEvents(state: State, personId: string): HrEvent[] {
  return [
    ...state.hrDone.filter((d) => d.personId === personId).map((d) => ({ date: d.date, kind: "done" as const, body: d.text })),
    ...state.regEdits.filter((d) => d.personId === personId).map((d) => ({ date: d.date, kind: "edit" as const, body: d.text, byHr: true })),
  ];
}

const byDate = (events: HrEvent[]) =>
  // 日付順（同じ日は、元の並びの順のまま）
  events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.date.localeCompare(b.e.date) || a.i - b.i)
    .map((x) => x.e);

function eventsOf(state: State): HrEvent[] {
  const today = DEMO_TODAY;
  // 進んでいる面談は1件を1行にし、状態の印を変えていく。済んだ面談は、面談の日付で1行ずつ残す（やり直しても消えない）
  const st = HR.meetingStatus;
  const finished = new Set(["done", "declined"].map((k) => st[k as "done" | "declined"]));
  const meetings: HrEvent[] = meetingsOf(state)
    .filter((m) => !finished.has(m.status))
    .map((m) => ({
      date: today,
      kind: "meeting",
      body: m.name,
      status: m.status,
      byHr: m.key === "occ",
    }));
  const logged: HrEvent[] = state.meetingLog.map((l) => ({
    date: l.date,
    kind: "meeting",
    body:
      l.key === "coordinator"
        ? HR.meetingName.coordinator(CONSULT.who[l.who ?? "coord"])
        : HR.meetingName[l.key],
    status: st[l.status],
    byHr: l.key === "occ" || l.key === "company",
  }));

  return byDate([
    ...state.hrMessages.map((m) => ({ date: m.date, kind: "fromHr" as const, body: m.title, noReply: m.noReplyNeeded })),
    ...state.sentToHr.map((s) => ({ date: s.date, kind: "fromPerson" as const, body: s.body })),
    ...logged,
    ...meetings,
    ...(state.doctorNote ? [{ date: today, kind: "submit" as const, body: HR.stepDoctor, byHr: true }] : []),
    ...state.reworkReports.map((r) => ({ date: r.date, kind: "submit" as const, body: HR.reportBody(r.month, r.days, r.rate) })),
    ...state.selfReports.map((r, i) => ({ date: r.date, kind: "submit" as const, body: HR.selfReportBody(r.date.slice(5).replace("-", "/")), report: i })),
    ...state.occOpinions.map((o) => ({
      date: o.date,
      kind: "meeting" as const,
      body: HR.opinion.line(HR.opinion.options[o.verdict], o.note),
      byHr: true,
    })),
    ...state.returnDecisionLog.map((d) => ({
      date: d.date,
      kind: "decision" as const,
      body: HR.decisionResult[d.result],
      byHr: true,
    })),
    // 同じ日なら、段階の切り替えは面談や提出のあと
    ...state.stageHistory.map((s) => ({ date: s.date, kind: "stage" as const, body: STAGE_LABELS[s.stage] })),
    ...(state.sharedDate ? [{ date: state.sharedDate, kind: "done" as const, body: INVITE.shareEvent, byHr: true }] : []),
    ...doneEvents(state, PERSON.id),
  ]);
}

// デモの本人の面談と、いまの状態
export type Meeting = { key: "psych" | "company" | "coordinator" | "occ"; name: string; status: string };
const monthDay = (d: string) => d.slice(5).replace("-", "/");

// 会社に伝えるのは、日程を調整中か・決まったかの事実だけ（日にちは出さない）
function scheduleStatus(s: Schedule | null): string | null {
  if (!s) return null;
  return s.chosen ? HR.meetingStatus.decided : HR.meetingStatus.adjusting;
}

export function meetingsOf(state: State): Meeting[] {
  const m: Meeting[] = [];
  const st = HR.meetingStatus;
  if (state.rivaMeetingApplied)
    m.push({
      key: "psych",
      name: HR.meetingName.psych,
      status: state.psychMeetingDone ? st.done : scheduleStatus(state.psychSchedule) ?? st.applied,
    });
  const c = state.companyMeeting;
  if (c)
    m.push({
      key: "company",
      name: HR.meetingName.company,
      status: c.status === "done" ? st.done : c.status === "scheduled" ? st.scheduled(monthDay(c.date ?? "")) : st.applied,
    });
  const o = state.occMeeting;
  if (o) m.push({ key: "occ", name: HR.meetingName.occ, status: o.status === "done" ? st.done : st.scheduled(monthDay(o.date)) });
  if (state.coordinatorMeeting === "applied")
    m.push({
      key: "coordinator",
      name: HR.meetingName.coordinator(CONSULT.who[state.coordWho]),
      status: state.coordinatorReport === "done" ? st.done : scheduleStatus(state.coordSchedule) ?? st.applied,
    });
  if (state.coordinatorMeeting === "requested")
    m.push({
      key: "coordinator",
      name: HR.meetingName.coordinatorRequest(CONSULT.who[state.coordWho]),
      status:
        state.coordinatorReport === "done"
          ? st.done
          : state.coordinatorReport === "declined"
            ? st.declined
            : scheduleStatus(state.coordSchedule) ?? st.requested,
    });
  return m;
}

// includeReturned：復職済みの人も含める（詳しい画面で、休職期間中の記録を見るため）
export function hrRows(state: State, includeReturned = false): HrRow[] {
  const done = new Set(state.hrDone.map((d) => d.key));
  const open = (todos: HrTodo[]) => todos.filter((t) => !done.has(t.key));

  // 登録して、本人がまだ始めていない人
  const pendingRow = (p: Invited): HrRow => ({
    id: p.id,
    name: p.name,
    dept: p.dept,
    stage: "acute",
    leaveStart: p.leaveStart,
    leaveEnd: p.leaveEnd,
    rework: HR.reworkNone,
    news: 0,
    incoming: 0,
    seen: 0,
    newFrom: 0,
    todos: [],
    events: [
      { date: p.date, kind: "done" as const, body: INVITE.event, byHr: true },
      ...p.resends.map((r) => ({ date: r.date, kind: "done" as const, body: INVITE.resendEvent(r.email), byHr: true })),
      ...doneEvents(state, p.id),
    ],
    invite: { date: p.date, email: p.email, resends: p.resends },
    live: false,
    pending: true,
    issues: p.issues,
    issueNotes: state.issueNotes[p.id] ?? [],
  });
  const live = state.live;
  // デモの本人：登録前は一覧に出さない。登録して本人が始める前は「まだ始めていません」
  const a: HrRow | null = !live
    ? null
    : !state.personStarted
      ? pendingRow(live)
      : {
    id: PERSON.id,
    name: live.name,
    dept: live.dept,
    stage: state.stage,
    leaveStart: live.leaveStart,
    leaveEnd: live.leaveEnd,
    rework: reworkOf(state),
    news: 0,
    incoming: 0,
    seen: state.hrSeen[PERSON.id] ?? 0,
    newFrom: state.hrNewFrom[PERSON.id] ?? 0,
    todos: open(todosOf(state)),
    events: eventsOf(state),
    live: true,
    issues: live.issues,
    issueNotes: state.issueNotes[PERSON.id] ?? [],
    rework_: state.prepPath === "rivabiz" || state.prepPath === "rivatore",
  };
  const others: HrRow[] = OTHER_PEOPLE.map((p) => ({
    id: p.id,
    name: p.name,
    dept: p.dept,
    stage: p.stage,
    leaveStart: p.leaveStart,
    leaveEnd: p.leaveEnd,
    rework: p.rework,
    news: 0,
    incoming: 0,
    seen: state.hrSeen[p.id] ?? p.seen,
    newFrom: state.hrNewFrom[p.id] ?? p.seen,
    todos: open(p.todo ? [p.todo] : []),
    issueNotes: state.issueNotes[p.id] ?? [],
    events: byDate([
      ...p.events,
      ...(state.hrMessagesOthers[p.id] ?? []).map((m) => ({
        date: m.date,
        kind: "fromHr" as const,
        body: m.title,
        noReply: m.noReplyNeeded,
      })),
      ...doneEvents(state, p.id),
    ]),
    live: false,
  }));
  const invited: HrRow[] = state.invited.map(pendingRow);
  // 満了日の60日前から、「対応が必要なこと」に自動で出す（日数は本来は会社の設定。いまは見本として固定）
  const withEnd = (r: HrRow): HrRow => {
    const left = daysUntil(r.leaveEnd);
    if (r.stage === "afterReturn" || left < 0 || left > END_NOTICE_DAYS) return r;
    const t: HrTodo = { key: `${r.id}-end-${r.leaveEnd}`, text: HR.todoEndNear, date: DEMO_TODAY, due: r.leaveEnd };
    return { ...r, todos: [...r.todos, ...open([t])] };
  };
  // 復職を確定した人は、休職者の一覧に出さない
  const people = [...(!a || (a.stage === "afterReturn" && !includeReturned) ? others : [a, ...others]), ...invited];
  return people.map(withEnd).map((r) => {
    const incoming = r.events.filter(isIncoming).length;
    return { ...r, incoming, news: Math.max(0, incoming - r.seen) };
  });
}

// 期限が近いもの → 新しく届いたもの、の順
export const isIncoming = (e: HrEvent) =>
  !e.byHr && (e.kind === "fromPerson" || e.kind === "submit" || e.kind === "meeting");

export function sortTodos<T extends { todo: HrTodo }>(items: T[]): T[] {
  return [...items].sort((x, y) => {
    const a = x.todo;
    const b = y.todo;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return b.date.localeCompare(a.date);
  });
}

// 期限までの日数
export const daysUntil = (due: string) => -daysSince(due);
export const END_NOTICE_DAYS = 60;
