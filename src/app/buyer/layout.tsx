import { BuyerNav } from "@/components/buyer/BuyerNav";
import { requireRole } from "@/lib/auth/guards";

export default async function BuyerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Guard lives here too — every /buyer/* page inherits it.
  await requireRole("BUYER");

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <aside>
        <BuyerNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
