import { redirect } from "next/navigation";

import { DemoCredentials } from "@/components/auth/DemoCredentials";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/auth/types";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await getSession();
  if (session && session.status === "ACTIVE") {
    const params = await searchParams;
    redirect(params.next ?? ROLE_HOME[session.role]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Access your N5Deal workspace. Use a seeded demo account below.
        </p>
        <LoginForm />
      </section>
      <section className="flex min-w-0 flex-col gap-4">
        <DemoCredentials />
      </section>
    </div>
  );
}
