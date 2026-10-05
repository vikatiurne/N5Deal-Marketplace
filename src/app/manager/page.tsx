import { requireRole } from "@/lib/auth/guards";

export default async function ManagerHomePage() {
  const user = await requireRole("MANAGER");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Manager console</h1>
      <p className="text-sm text-muted-foreground">
        Welcome, {user.email}. Member and asset moderation arrive in the next
        tasks.
      </p>
    </div>
  );
}
