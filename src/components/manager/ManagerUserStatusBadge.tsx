import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/types";

const STYLES: Record<UserStatus, string> = {
  ACTIVE: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
  SUSPENDED:
    "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
  DELETED:
    "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20",
};

const LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DELETED: "Deleted",
};

export function ManagerUserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {LABELS[status]}
    </Badge>
  );
}
