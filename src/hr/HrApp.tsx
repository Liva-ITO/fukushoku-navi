import { COMMON } from "../constants/labels";
import type { State } from "../state/store";

type Props = { state: State };

// 会社（人事・産業保健）の画面。本人が提出したものと、本人とのやり取りだけを表示する
export default function HrApp(_props: Props) {
  return (
    <div className="hr">
      <p className="placeholder">{COMMON.comingSoon}</p>
    </div>
  );
}
