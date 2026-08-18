import type { CSSProperties } from "react";
import { BenchIcon, TreeIcon, BuildingIcon, ScissorsIcon, MapPinIcon } from "./icons";
import { ProposalCategory } from "@/lib/enums";

const ICON_BY_CATEGORY: Record<ProposalCategory, (props: { className?: string; style?: CSSProperties }) => React.JSX.Element> = {
  park_facility: BenchIcon,
  greening: TreeIcon,
  private_greening: BuildingIcon,
  tree_care: ScissorsIcon,
  other: MapPinIcon,
};

// 絵文字(旧 PROPOSAL_CATEGORY_ICON)の代わりに使うカテゴリアイコンの単一の入り口。
// 未知のカテゴリ値は MapPinIcon にフォールバックする。
export default function CategoryIcon({
  category,
  className = "h-5 w-5",
  style,
}: {
  category: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = ICON_BY_CATEGORY[category as ProposalCategory] ?? MapPinIcon;
  return <Icon className={className} style={style} />;
}
