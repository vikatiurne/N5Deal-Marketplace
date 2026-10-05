import { ManagerNav } from "@/components/manager/ManagerNav";
import { requireRole } from "@/lib/auth/guards";

export default async function ManagerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole("MANAGER");

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <aside>
        <ManagerNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
