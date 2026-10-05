import { requireRole } from "@/lib/auth/guards";

export default async function SellerHomePage() {
  const user = await requireRole("SELLER");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Seller workspace</h1>
      <p className="text-sm text-muted-foreground">
        Welcome, {user.email}. Asset publishing and incoming inquiries arrive in
        the next tasks.
      </p>
    </div>
  );
}
