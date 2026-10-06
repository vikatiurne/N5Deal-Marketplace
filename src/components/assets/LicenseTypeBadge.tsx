import { LICENSE_BADGE_STYLES, LICENSE_LABELS } from "@/lib/badgeStyles";
import { Badge } from "@/components/ui/badge";
import { LicenseType } from "@/types";

/**
 * The one way a licence is rendered. Before task 09 this badge existed as the
 * same inline class string in four files, while four other pages printed the
 * raw enum as monospace text — so `MICA_CASP` reached the user both as a pill
 * and as a database value.
 */
export function LicenseTypeBadge({
  value,
  className,
}: {
  value: LicenseType;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`${LICENSE_BADGE_STYLES[value]} ${className ?? ""}`}
    >
      {LICENSE_LABELS[value]}
    </Badge>
  );
}
