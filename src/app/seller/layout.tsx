import { SellerNav } from "@/components/seller/SellerNav";
import { requireRole } from "@/lib/auth/guards";

export default async function SellerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole("SELLER");

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <aside>
        <SellerNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
