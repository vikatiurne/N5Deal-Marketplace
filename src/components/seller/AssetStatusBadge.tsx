import { Badge } from "@/components/ui/badge";
import { ASSET_STATUS_KEYS } from "@/i18n/core";
import { getT } from "@/i18n/server";
import { ASSET_STATUS_STYLES } from "@/lib/badgeStyles";
import type { AssetStatus } from "@/types";

export async function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const t = await getT();
  return (
    <Badge variant="outline" className={ASSET_STATUS_STYLES[status]}>
      {t(ASSET_STATUS_KEYS[status])}
    </Badge>
  );
}
