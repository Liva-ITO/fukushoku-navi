import { HR, RECOVERY, STAGE_LABELS, type Stage } from "../constants/labels";
import { DEMO_TODAY, OTHER_PEOPLE, PERSON, type HrEvent } from "../data/demo";
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
  todos: string[];
  events: HrEvent[];
  live: boolean; // 本人画面と連動しているか
};

function reworkOf(state: State): string {
  if (state.prepPath === null) return HR.reworkNone;
  if (state.prepPath === "self") return HR.reworkSelf;
  return RECOVERY.pathOptions[state.prepPath].name;
}

function todosOf(state: State): string[] {
  const t: string[] = [];
  if (state.stage === "acute" && state.psychMeetingDone) t.push(HR.todoA.psychDone);
  else if (state.stage === "acute" && state.rivaMeetingApplied) t.push(HR.todoA.psychMeeting);
  if (state.companyMeetingApplied) t.push(HR.todoA.companyMeeting);
  if (state.coordinatorMeeting === "applied") t.push(HR.todoA.coordinatorApplied);
  if (state.coordinatorMeeting === "requested") t.push(HR.todoA.coordinatorRequested);
  if (state.sentToHr.length > 0) t.push(HR.todoA.newFromPerson(state.sentToHr.length));
  return t;
}

function eventsOf(state: State): HrEvent[] {
  // 申し込みはデモの「今日」に起きたものとして並べる
  const today = DEMO_TODAY;
  const meetings: HrEvent[] = [];
  if (state.rivaMeetingApplied) meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.psych });
  if (state.psychMeetingDone) meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.psychDone });
  if (state.companyMeetingApplied) meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.company });
  if (state.coordinatorMeeting === "applied")
    meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.coordinatorApplied });
  if (state.coordinatorMeeting === "requested")
    meetings.push({ date: today, kind: "meeting", body: HR.meetingEvent.coordinatorRequested });

  const all: HrEvent[] = [
    ...state.stageHistory.map((s) => ({ date: s.date, kind: "stage" as const, body: STAGE_LABELS[s.stage] })),
    ...state.hrMessages.map((m) => ({ date: m.date, kind: "fromHr" as const, body: m.body })),
    ...state.sentToHr.map((s) => ({ date: s.date, kind: "fromPerson" as const, body: s.body })),
    ...meetings,
  ];
  // 日付順（同じ日は、上の並びの順のまま）
  return all.map((e, i) => ({ e, i })).sort((a, b) => a.e.date.localeCompare(b.e.date) || a.i - b.i).map((x) => x.e);
}

export function hrRows(state: State): HrRow[] {
  const a: HrRow = {
    id: PERSON.id,
    name: PERSON.name,
    dept: PERSON.dept,
    stage: state.stage,
    leaveStart: PERSON.leaveStart,
    leaveEnd: PERSON.leaveEnd,
    rework: reworkOf(state),
    news: state.sentToHr.length,
    todos: todosOf(state),
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
    news: p.news,
    todos: p.todo ? [p.todo] : [],
    events: p.events,
    live: false,
  }));
  return [a, ...others];
}
