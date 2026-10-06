import { Badge } from "@/components/ui/badge";
import { ASSET_STATUS_LABELS, ASSET_STATUS_STYLES } from "@/lib/badgeStyles";
import type { AssetStatus } from "@/types";

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant="outline" className={ASSET_STATUS_STYLES[status]}>
      {ASSET_STATUS_LABELS[status]}
    </Badge>
  );
}
