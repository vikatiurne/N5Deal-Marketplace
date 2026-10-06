/**
 * Seeded demo accounts shown on the login page. Shared between the server
 * page (reads live statuses) and the client panel (renders them) — lives in
 * its own module so the server never imports from a "use client" file.
 */
export const DEMO_ACCOUNTS: Array<{
  role: "Manager" | "Seller" | "Buyer";
  email: string;
  password: string;
}> = [
  { role: "Manager", email: "manager@n5deal.test", password: "password123" },
  { role: "Seller", email: "seller1@n5deal.test", password: "password123" },
  { role: "Seller", email: "seller2@n5deal.test", password: "password123" },
  { role: "Seller", email: "seller3@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer1@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer2@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer3@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer4@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer5@n5deal.test", password: "password123" },
];
