import { requireRole } from "@/lib/auth/guards";

export default async function BuyerHomePage() {
  const user = await requireRole("BUYER");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Buyer workspace</h1>
      <p className="text-sm text-muted-foreground">
        Welcome, {user.email}. Asset browsing and profile management arrive in
        the next tasks.
      </p>
    </div>
  );
}
