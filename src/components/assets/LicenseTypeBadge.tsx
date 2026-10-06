import { Badge } from "@/components/ui/badge";
import { LICENSE_BADGE_STYLES } from "@/lib/badgeStyles";
import { LICENSE_KEYS } from "@/i18n/core";
import { getT } from "@/i18n/server";
import { LicenseType } from "@/types";

/**
 * The one way a licence is rendered. Before task 09 this badge existed as the
 * same inline class string in four files, while four other pages printed the
 * raw enum as monospace text — so `MICA_CASP` reached the user both as a pill
 * and as a database value.
 */
export async function LicenseTypeBadge({
  value,
  className,
}: {
  value: LicenseType;
  className?: string;
}) {
  const t = await getT();
  return (
    <Badge
      variant="outline"
      className={`${LICENSE_BADGE_STYLES[value]} ${className ?? ""}`}
    >
      {t(LICENSE_KEYS[value])}
    </Badge>
  );
}
