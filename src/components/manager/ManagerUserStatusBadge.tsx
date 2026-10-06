import { Badge } from "@/components/ui/badge";
import { USER_STATUS_LABELS, USER_STATUS_STYLES } from "@/lib/badgeStyles";
import type { UserStatus } from "@/types";

export function ManagerUserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="outline" className={USER_STATUS_STYLES[status]}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
}
