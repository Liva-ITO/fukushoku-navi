import { useState, type Dispatch } from "react";
import { TORISETSU } from "../constants/labels";
import type { Action, State } from "../state/store";

type Props = { state: State; dispatch: Dispatch<Action> };

// 自分の取説（たたき台）：休職のふり返りから、注意サインと対処を自分の言葉でまとめる。
// 会社には届かない。復職したあとも、見守りモードで見返せる
export function TorisetsuCard({ state, dispatch, readOnly = false }: Props & { readOnly?: boolean }) {
  const t = state.torisetsu;
  // 書き始めの助けに、会社に出したレポートの「休職に至った理由」「対策」を入れておく（書き直せる）
  const last = state.selfReports[state.selfReports.length - 1];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    t ?? { reason: last?.reason ?? "", signs: "", actions: last?.measures ?? "", help: "" },
  );

  if (!editing)
    return (
      <section className="card">
        <h2>{TORISETSU.title}</h2>
        {t ? (
          <dl className="report-view">
            {/* 復職後は、休職に至った背景を毎回出さない（職場で開いたときに目に入らないように） */}
            {TORISETSU.fields.filter((f) => !readOnly || f.key !== "reason").map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd>{t[f.key] || "—"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted">{readOnly ? TORISETSU.noneWatch : TORISETSU.note}</p>
        )}
        <p className="muted">{TORISETSU.private}</p>
        <button
          className="btn-outline"
          onClick={() => {
            setDraft(t ?? { reason: last?.reason ?? "", signs: "", actions: last?.measures ?? "", help: "" });
            setEditing(true);
          }}
        >
          {t ? TORISETSU.edit : TORISETSU.start}
        </button>
      </section>
    );

  return (
    <section className="card">
      <h2>{TORISETSU.title}</h2>
      <p className="muted">{TORISETSU.writeNote}</p>
      {TORISETSU.fields.map((f) => (
        <label key={f.key} className="field field-tight">
          {f.label}
          <textarea
            rows={3}
            placeholder={f.hint}
            value={draft[f.key]}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
          />
        </label>
      ))}
      <div className="confirm-actions">
        <button
          className="btn-primary"
          onClick={() => {
            dispatch({ type: "saveTorisetsu", torisetsu: draft });
            setEditing(false);
          }}
        >
          {TORISETSU.save}
        </button>
        <button className="btn-quiet" onClick={() => setEditing(false)}>
          {TORISETSU.cancel}
        </button>
      </div>
    </section>
  );
}
