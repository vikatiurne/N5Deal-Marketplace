import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLES = [
  {
    title: "Buyer",
    description:
      "Find licensed fintech companies, filter by license type and jurisdiction, contact sellers.",
    href: "/assets",
    cta: "Browse assets",
  },
  {
    title: "Seller",
    description:
      "Publish assets, browse buyer profiles and respond to incoming inquiries.",
    href: "/seller",
    cta: "Open seller workspace",
  },
  {
    title: "Platform Manager",
    description:
      "Moderate members and assets, search and filter the platform, manage compliance.",
    href: "/manager",
    cta: "Open manager console",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-start gap-4">
        <Badge variant="outline" className="border-primary/40 text-primary">
          Test assignment build
        </Badge>
        <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">
          N5Deal — marketplace for FinTech &amp; M&amp;A assets
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Buy and sell licensed fintech companies: EMI, PI, MiCA CASP and more.
          Persistent demo data, role-based workspaces, AI-assisted search.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/assets">Browse assets</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </section>

      <section aria-label="Roles" className="grid gap-4 sm:grid-cols-3">
        {ROLES.map((role) => (
          <Card key={role.title} className="bg-surface">
            <CardHeader>
              <CardTitle className="text-lg">{role.title}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link
                href={role.href}
                className="text-sm font-medium text-primary hover:underline hover:underline-offset-4"
              >
                {role.cta} →
              </Link>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
