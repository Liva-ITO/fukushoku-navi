import type { Dispatch } from "react";
import { CONSULT } from "../constants/labels";
import type { Action, State } from "../state/store";
import { CoordinatorCard, PublicLines } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 相談：申し込むところまで。日程の候補などのやり取りは「連絡」タブに届く
export default function ConsultTab({ state, dispatch }: Props) {
  return (
    <div>
      <h1 className="page-title">{CONSULT.title}</h1>
      <CoordinatorCard state={state} dispatch={dispatch} showNewLink={false} />

      {/* つらいときの連絡先は、チケットとは切り離して、いつでもたどれるようにする */}
      <section className="other-places">
        <h2>{CONSULT.otherTitle}</h2>
        <PublicLines />
      </section>
    </div>
  );
}
