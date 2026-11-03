import { useState, type Dispatch } from "react";
import { INVITE } from "../constants/labels";
import { DEMO_TODAY } from "../data/demo";
import type { Action } from "../state/store";

// 休職者の登録（見本）。本番では、ここで入れる本人の個人のメールアドレスに案内が届き、本人は自分のアカウントで始める。
// デモでは何も送らず、一覧に「「まだ始めていません」」の行が増えるだけ
export default function InviteForm({ depts, dispatch }: { depts: string[]; dispatch: Dispatch<Action> }) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [age, setAge] = useState(INVITE.ages[1]);
  const [job, setJob] = useState(INVITE.jobs[0]);
  const [leaveStart, setLeaveStart] = useState(DEMO_TODAY);
  const [leaveEnd, setLeaveEnd] = useState("");
  const [issues, setIssues] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  // 満了日は開始日より後（同じ日や前の日は、入れまちがい）
  const endInvalid = leaveEnd !== "" && leaveEnd <= leaveStart;
  const ready = name.trim() && dept.trim() && leaveStart && leaveEnd && !endInvalid && /.+@.+\..+/.test(email.trim());

  if (sent)
    return (
      <section className="hr-card invite">
        <h1 className="hr-title">{INVITE.title}</h1>
        <p className="done-note">{INVITE.sent(sent)}</p>
        <button className="btn-outline" onClick={() => dispatch({ type: "hrPage", page: "list" })}>
          {INVITE.back}
        </button>
      </section>
    );

  return (
    <section className="hr-card invite">
      <h1 className="hr-title">{INVITE.title}</h1>
      <p className="muted">{INVITE.note}</p>
      <div className="invite-grid">
        <label className="hr-field">
          {INVITE.name}
          <input className="hr-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {/* 部署は会社の設定の一覧から選ぶ（書き方の揺れで、集計が分かれないように） */}
        <label className="hr-field">
          {INVITE.dept}
          <select className="hr-input" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">{INVITE.deptPick}</option>
            {depts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          {depts.length === 0 && <span className="muted">{INVITE.deptNone}</span>}
        </label>
        <label className="hr-field">
          {INVITE.age}
          <select className="hr-input" value={age} onChange={(e) => setAge(e.target.value)}>
            {INVITE.ages.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="hr-field">
          {INVITE.job}
          <select className="hr-input" value={job} onChange={(e) => setJob(e.target.value)}>
            {INVITE.jobs.map((j) => (
              <option key={j}>{j}</option>
            ))}
          </select>
        </label>
        <label className="hr-field invite-wide">
          {INVITE.email}
          <input className="hr-input" type="email" placeholder={INVITE.emailExample} value={email} onChange={(e) => setEmail(e.target.value)} />
          <span className="muted">{INVITE.emailNote}</span>
        </label>
        <label className="hr-field">
          {INVITE.leaveStart}
          <input className="hr-input" type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
        </label>
        <label className="hr-field">
          {INVITE.leaveEnd}
          <input className="hr-input" type="date" min={leaveStart} value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
          {endInvalid && <span className="field-error">{INVITE.leaveEndInvalid}</span>}
        </label>
      </div>
      <label className="hr-field">
        {INVITE.issues}
        <textarea
          className="hr-textarea"
          rows={4}
          placeholder={INVITE.issuesExample}
          value={issues}
          onChange={(e) => setIssues(e.target.value)}
        />
        <span className="muted">{INVITE.issuesNote}</span>
      </label>
      <div className="confirm-actions">
        <button
          className="btn-primary"
          disabled={!ready}
          onClick={() => {
            dispatch({ type: "invite", person: { name: name.trim(), dept: dept.trim(), age, job, leaveStart, leaveEnd, issues: issues.trim(), email: email.trim() } });
            setSent(name.trim());
          }}
        >
          {INVITE.send}
        </button>
        <button className="btn-quiet" onClick={() => dispatch({ type: "hrPage", page: "list" })}>
          {INVITE.back}
        </button>
      </div>
    </section>
  );
}
