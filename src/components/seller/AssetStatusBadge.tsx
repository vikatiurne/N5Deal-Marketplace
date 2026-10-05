import { Badge } from "@/components/ui/badge";
import type { AssetStatus } from "@/types";

const STYLES: Record<AssetStatus, string> = {
  PUBLISHED: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
  DRAFT: "border-border bg-muted text-muted-foreground hover:bg-muted",
  PAUSED:
    "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
  REMOVED:
    "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20",
};

const LABELS: Record<AssetStatus, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  PAUSED: "Paused",
  REMOVED: "Removed",
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {LABELS[status]}
    </Badge>
  );
}
