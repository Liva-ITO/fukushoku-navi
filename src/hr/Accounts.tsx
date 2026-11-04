import { useState, type Dispatch } from "react";
import { ACCOUNTS } from "../constants/labels";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

// アカウント管理（管理者だけ）。会社側でサービスを使う人を、管理者かスタッフとして登録する
export default function Accounts({ state, dispatch }: Props) {
  const admins = state.hrAccounts.filter((a) => a.role === "admin").length;
  const [adding, setAdding] = useState(false);

  return (
    <section className="hr-card settings">
      <h1 className="hr-title">{ACCOUNTS.title}</h1>
      <p className="muted">{ACCOUNTS.note}</p>
      <p className="muted">{ACCOUNTS.demoNote}</p>

      <table className="hr-table accounts-table">
        <thead>
          <tr>
            <th>{ACCOUNTS.name}</th>
            <th>{ACCOUNTS.position}</th>
            <th>{ACCOUNTS.role}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {state.hrAccounts.map((a) => {
            // 最後の管理者は、スタッフにしたり外したりできない
            const locked = a.role === "admin" && admins <= 1;
            return (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.position}</td>
                <td>
                  {a.role === "boss" ? (
                    <span>
                      {ACCOUNTS.roles.boss}
                      <span className="muted">　{assignedOf(state, a.id)}</span>
                    </span>
                  ) : (
                  <select
                    className="hr-input"
                    value={a.role}
                    disabled={locked}
                    title={locked ? ACCOUNTS.lastAdmin : undefined}
                    onChange={(e) => dispatch({ type: "setAccountRole", id: a.id, role: e.target.value as "admin" | "staff" })}
                  >
                    {(["admin", "staff"] as const).map((r) => (
                      <option key={r} value={r}>
                        {ACCOUNTS.roles[r]}
                      </option>
                    ))}
                  </select>
                  )}
                </td>
                <td>
                  <button className="btn-quiet btn-small" disabled={locked} onClick={() => dispatch({ type: "removeAccount", id: a.id })}>
                    {ACCOUNTS.remove}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {admins <= 1 && <p className="muted">{ACCOUNTS.lastAdmin}</p>}

      {adding ? (
        <AddAccount dispatch={dispatch} onClose={() => setAdding(false)} />
      ) : (
        <button className="btn-outline" onClick={() => setAdding(true)}>
          ＋ {ACCOUNTS.add}
        </button>
      )}
    </section>
  );
}

// 上司が担当している休職者の名前
function assignedOf(state: State, id: string): string {
  const names = [...(state.live ? [state.live] : []), ...state.invited].filter((p) => p.bossId === id).map((p) => p.name);
  return names.length ? ACCOUNTS.assigned(names.join("、")) : ACCOUNTS.assignedNone;
}

function AddAccount({ dispatch, onClose }: { dispatch: Dispatch<Action>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState(ACCOUNTS.positions[0]);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [email, setEmail] = useState("");
  const ready = name.trim() !== "" && /.+@.+\..+/.test(email.trim());
  return (
    <fieldset className="setting">
      <legend>{ACCOUNTS.addTitle}</legend>
      <div className="invite-grid">
        <label className="hr-field">
          {ACCOUNTS.name}
          <input className="hr-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="hr-field">
          {ACCOUNTS.position}
          <select className="hr-input" value={position} onChange={(e) => setPosition(e.target.value)}>
            {ACCOUNTS.positions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="hr-field">
          {ACCOUNTS.role}
          <select className="hr-input" value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")}>
            {(["staff", "admin"] as const).map((r) => (
              <option key={r} value={r}>
                {ACCOUNTS.roles[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="hr-field">
          {ACCOUNTS.email}
          <input className="hr-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <span className="muted">{ACCOUNTS.emailNote}</span>
        </label>
      </div>
      <div className="confirm-actions">
        <button
          className="btn-primary btn-small"
          disabled={!ready}
          onClick={() => {
            dispatch({ type: "addAccount", account: { name: name.trim(), position, role, email: email.trim() } });
            onClose();
          }}
        >
          {ACCOUNTS.save}
        </button>
        <button className="btn-quiet btn-small" onClick={onClose}>
          {ACCOUNTS.cancel}
        </button>
      </div>
    </fieldset>
  );
}
