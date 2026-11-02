import { HR, RECOVERY, STAGE_LABELS, type Stage } from "../constants/labels";
import { DEMO_TODAY, OTHER_PEOPLE, PERSON, daysSince, type HrEvent, type HrTodo } from "../data/demo";
import type { State } from "../state/store";

// 人事画面で使う形にそろえる。社員Aは本人画面の状態から作り、ほかの人は架空データをそのまま使う
export type HrRow = {
  id: string;
  name: string;
  dept: string;
  stage: Stage;
  leaveStart: string;
  leaveEnd: string;
  rework: string;
  news: number;
  todos: HrTodo[];
  events: HrEvent[];
  live: boolean; // 本人画面と連動しているか
};

function reworkOf(state: State): string {
  if (state.prepPath === null) return HR.reworkNone;
  if (state.prepPath === "self") return HR.reworkSelf;
  return RECOVERY.pathOptions[state.prepPath].name;
}

// 社員Aの「対応が必要なこと」。申し込みはデモの「今日」に届いたものとして扱う
function todosOf(state: State): HrTodo[] {
  const t: HrTodo[] = [];
  const at = (key: string, text: string) => t.push({ key, text, date: DEMO_TODAY });
  if (state.stage === "acute" && state.psychMeetingDone) at("a-psych-done", HR.todoA.psychDone);
  else if (state.stage === "acute" && state.rivaMeetingApplied) at("a-psych", HR.todoA.psychMeeting);
  if (state.companyMeetingApplied) at("a-company", HR.todoA.companyMeeting);
  if (state.coordinatorMeeting === "applied") at("a-coord", HR.todoA.coordinatorApplied);
  if (state.coordinatorMeeting === "requested") at("a-coord-req", HR.todoA.coordinatorRequested);
  // 本人からの連絡は、届いた件数ごとに別の項目にする（対応済みのあとに新しく届いたら、また出す）
  if (state.sentToHr.length > 0) at(`a-msg-${state.sentToHr.length}`, HR.todoA.newFromPerson(state.sentToHr.length));
  return t;
}

function doneEvents(state: State, personId: string): HrEvent[] {
  return state.hrDone
    .filter((d) => d.personId === personId)
    .map((d) => ({ date: d.date, kind: "done" as const, body: d.text }));
}

const byDate = (events: HrEvent[]) =>
  // 日付順（同じ日は、元の並びの順のまま）
  events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.date.localeCompare(b.e.date) || a.i - b.i)
    .map((x) => x.e);

function eventsOf(state: State): HrEvent[] {
  const today = DEMO_TODAY;
  const meetings: HrEvent[] = [];
  if (state.rivaMeetingApplied) meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.psych });
  if (state.psychMeetingDone) meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.psychDone });
  if (state.companyMeetingApplied) meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.company });
  if (state.coordinatorMeeting === "applied")
    meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.coordinatorApplied });
  if (state.coordinatorMeeting === "requested")
    meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.coordinatorRequested });

  return byDate([
    ...state.stageHistory.map((s) => ({ date: s.date, kind: "stage" as const, body: STAGE_LABELS[s.stage] })),
    ...state.hrMessages.map((m) => ({ date: m.date, kind: "fromHr" as const, body: m.body })),
    ...state.sentToHr.map((s) => ({ date: s.date, kind: "fromPerson" as const, body: s.body })),
    ...meetings,
    ...doneEvents(state, PERSON.id),
  ]);
}

export function hrRows(state: State): HrRow[] {
  const done = new Set(state.hrDone.map((d) => d.key));
  const open = (todos: HrTodo[]) => todos.filter((t) => !done.has(t.key));

  const a: HrRow = {
    id: PERSON.id,
    name: PERSON.name,
    dept: PERSON.dept,
    stage: state.stage,
    leaveStart: PERSON.leaveStart,
    leaveEnd: PERSON.leaveEnd,
    rework: reworkOf(state),
    news: Math.max(0, state.sentToHr.length - (state.hrSeen[PERSON.id] ?? 0)),
    todos: open(todosOf(state)),
    events: eventsOf(state),
    live: true,
  };
  const others: HrRow[] = OTHER_PEOPLE.map((p) => ({
    id: p.id,
    name: p.name,
    dept: p.dept,
    stage: p.stage,
    leaveStart: p.leaveStart,
    leaveEnd: p.leaveEnd,
    rework: p.rework,
    news: state.hrSeen[p.id] ? 0 : p.news,
    todos: open(p.todo ? [p.todo] : []),
    events: byDate([...p.events, ...doneEvents(state, p.id)]),
    live: false,
  }));
  return [a, ...others];
}

// 期限が近いもの → 新しく届いたもの、の順
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
