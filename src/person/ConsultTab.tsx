import type { Dispatch } from "react";
import { CONSULT } from "../constants/labels";
import type { Action, State } from "../state/store";
import { CoordinatorCard } from "./parts";

type Props = { state: State; dispatch: Dispatch<Action> };

// 相談：復職コーディネーターとの面談は、段階に関係なく、相談したいときに本人が選ぶ
export default function ConsultTab({ state, dispatch }: Props) {
  return (
    <div>
      <h1 className="page-title">{CONSULT.title}</h1>
      <CoordinatorCard state={state} dispatch={dispatch} />
    </div>
  );
}
