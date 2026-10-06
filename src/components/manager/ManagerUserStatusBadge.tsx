import { Badge } from "@/components/ui/badge";
import { USER_STATUS_KEYS } from "@/i18n/core";
import { getT } from "@/i18n/server";
import { USER_STATUS_STYLES } from "@/lib/badgeStyles";
import type { UserStatus } from "@/types";

export async function ManagerUserStatusBadge({
  status,
}: {
  status: UserStatus;
}) {
  const t = await getT();
  return (
    <Badge variant="outline" className={USER_STATUS_STYLES[status]}>
      {t(USER_STATUS_KEYS[status])}
    </Badge>
  );
}
