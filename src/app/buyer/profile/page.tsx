import type { Metadata } from "next";

import { BuyerProfileForm } from "@/components/buyer/BuyerProfileForm";
import { requireRole } from "@/lib/auth/guards";
import { findBuyerProfile } from "@/lib/db/repositories/buyers";
import { findUserById } from "@/lib/db/repositories/users";

export const metadata: Metadata = {
  title: "Buyer profile",
};

export default async function BuyerProfilePage() {
  const user = await requireRole("BUYER");

  const [account, profile] = await Promise.all([
    findUserById(user.id),
    findBuyerProfile(user.id),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
        <p className="text-sm text-muted-foreground">
          Tell sellers what you are looking for — the same criteria power your
          matched listings.
        </p>
      </div>

      <BuyerProfileForm company={account?.company ?? ""} profile={profile} />
    </div>
  );
}
