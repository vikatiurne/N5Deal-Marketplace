import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/auth/types";

export default async function RegisterPage() {
  const session = await getSession();
  if (session && session.status === "ACTIVE") {
    redirect(ROLE_HOME[session.role]);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="text-sm text-muted-foreground">
        Register as a buyer or seller. Platform manager accounts are issued by
        the platform team only.
      </p>
      <RegisterForm />
    </div>
  );
}
