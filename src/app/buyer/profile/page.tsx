import { BuyerProfileForm } from "@/components/buyer/BuyerProfileForm";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import { findBuyerProfile } from "@/lib/db/repositories/buyers";
import { findUserById } from "@/lib/db/repositories/users";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("buyer.profile.meta.title"),
  };
}

export default async function BuyerProfilePage() {
  const user = await requireRole("BUYER");
  const t = await getT();

  const [account, profile] = await Promise.all([
    findUserById(user.id),
    findBuyerProfile(user.id),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("buyer.profile.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("buyer.profile.subtitle")}
        </p>
      </div>

      <BuyerProfileForm company={account?.company ?? ""} profile={profile} />
    </div>
  );
}
