import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "password123";

async function main() {
  const passwordHash = bcrypt.hashSync(PASSWORD, 10);

  // Wipe in FK-safe order so the seed is idempotent.
  await prisma.inquiry.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.user.deleteMany();

  // --- Users ---------------------------------------------------------------

  await prisma.user.create({
    data: {
      email: "manager@n5deal.test",
      passwordHash,
      role: "MANAGER",
      status: "ACTIVE",
      displayName: "Anna Manager",
      company: "N5Deal Platform",
    },
  });

  const sellers = await Promise.all(
    [
      {
        email: "seller1@n5deal.test",
        name: "Tomas Vasquez",
        company: "Baltic EMI Holdings",
      },
      {
        email: "seller2@n5deal.test",
        name: "Elena Christou",
        company: "Mediterranean Pay Ltd",
      },
      // Suspended to exercise manager views (task requirement).
      {
        email: "seller3@n5deal.test",
        name: "Marek Kowalski",
        company: "Vistula Digital Assets",
        suspended: true,
      },
    ].map(({ email, name, company, suspended }) =>
      prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "SELLER",
          status: suspended ? "SUSPENDED" : "ACTIVE",
          displayName: name,
          company,
        },
      }),
    ),
  );

  const buyerSeeds = [
    {
      email: "buyer1@n5deal.test",
      name: "Sofia Lindqvist",
      company: "Nordic Ventures AB",
      jurisdictions: ["SE", "EE", "LT"],
      licenseTypes: ["EMI", "PI"],
      budgetMin: 500_000,
      budgetMax: 2_500_000,
      description:
        "Looking for an established EMI in the Baltics with passporting rights across the EEA.",
    },
    {
      email: "buyer2@n5deal.test",
      name: "Andreas Meyer",
      company: "Helvetia Fintech AG",
      jurisdictions: ["CY", "MT"],
      licenseTypes: ["MICA_CASP", "VASP"],
      budgetMin: 750_000,
      budgetMax: 3_000_000,
      description:
        "Seeking a MiCA-licensed CASP with an existing tokenization stack and clean compliance history.",
    },
    {
      email: "buyer3@n5deal.test",
      name: "Petra Novakova",
      company: "Central Europe Capital s.r.o.",
      jurisdictions: ["PL", "CZ", "EE"],
      licenseTypes: ["PI", "VASP"],
      budgetMin: 150_000,
      budgetMax: 900_000,
      description:
        "Payment institution with card acquiring volume; open to turnaround cases.",
    },
    {
      email: "buyer4@n5deal.test",
      name: "Liam O'Connor",
      company: "Celtic Digital Group",
      jurisdictions: ["LT", "CY"],
      licenseTypes: ["EMI", "VASP"],
      budgetMin: 1_000_000,
      budgetMax: 3_000_000,
      description:
        "Consolidating several Baltic fintechs; interested in teams that can relocate.",
    },
    {
      email: "buyer5@n5deal.test",
      name: "Maija Virtanen",
      company: "Suomi Growth Oy",
      jurisdictions: ["EE", "FI", "LT"],
      licenseTypes: ["EMI", "PI"],
      budgetMin: 300_000,
      budgetMax: 1_500_000,
      description:
        "First acquisition — prefers profitable, low-risk payment businesses with 3+ years of history.",
    },
  ] as const;

  const buyers = await Promise.all(
    buyerSeeds.map((b) =>
      prisma.user.create({
        data: {
          email: b.email,
          passwordHash,
          role: "BUYER",
          status: "ACTIVE",
          displayName: b.name,
          company: b.company,
          profile: {
            create: {
              jurisdictions: JSON.stringify(b.jurisdictions),
              licenseTypes: JSON.stringify(b.licenseTypes),
              budgetMin: b.budgetMin,
              budgetMax: b.budgetMax,
              description: b.description,
            },
          },
        },
      }),
    ),
  );

  // --- Assets: 20 across LT/CY/MT/EE/PL ------------------------------------
  // statuses: 18 PUBLISHED, 1 DRAFT, 1 PAUSED (task requirement).

  const assetSeeds: Array<{
    title: string;
    licenseType: "EMI" | "PI" | "MICA_CASP" | "VASP";
    jurisdiction: "LT" | "CY" | "MT" | "EE" | "PL";
    price: number;
    description: string;
    status?: "DRAFT" | "PAUSED";
    sellerIndex: number;
  }> = [
    {
      title: "Nordic Pay EMI",
      licenseType: "EMI",
      jurisdiction: "LT",
      price: 2_400_000,
      description:
        "Licensed electronic money institution in Lithuania with 40k active accounts and full EEA passporting. Profitable since 2021.",
      sellerIndex: 0,
    },
    {
      title: "Baltic Card Processing",
      licenseType: "PI",
      jurisdiction: "LT",
      price: 1_250_000,
      description:
        "Payment institution focused on card acquiring for regional e-commerce merchants.",
      sellerIndex: 0,
    },
    {
      title: "Amber Crypto Exchange",
      licenseType: "VASP",
      jurisdiction: "LT",
      price: 1_900_000,
      description:
        "Virtual asset service provider with FIU registration, spot trading and custody.",
      sellerIndex: 0,
    },
    {
      title: "Fintech Hub Vilnius",
      licenseType: "EMI",
      jurisdiction: "LT",
      price: 3_000_000,
      description:
        "EMI + PI dual license holder with banking-as-a-service API stack and 60+ B2B clients.",
      sellerIndex: 0,
    },
    {
      title: "PayCy Ltd",
      licenseType: "EMI",
      jurisdiction: "CY",
      price: 2_750_000,
      description:
        "Cyprus EMI issuing prepaid cards for the EU travel industry.",
      sellerIndex: 1,
    },
    {
      title: "Hellenic Remit",
      licenseType: "PI",
      jurisdiction: "CY",
      price: 980_000,
      description:
        "Cross-border remittance payment institution covering GR-CY corridor.",
      sellerIndex: 1,
    },
    {
      title: "Aegean Wallet",
      licenseType: "EMI",
      jurisdiction: "CY",
      price: 1_450_000,
      description:
        "Mobile wallet and IBAN accounts for freelancers in Southern Europe.",
      sellerIndex: 1,
    },
    {
      title: "Island Token Markets",
      licenseType: "MICA_CASP",
      jurisdiction: "MT",
      price: 2_100_000,
      description:
        "MiCA-ready CASP with ART issuance framework and institutional custody.",
      sellerIndex: 1,
    },
    {
      title: "Malta Staking Services",
      licenseType: "VASP",
      jurisdiction: "MT",
      price: 890_000,
      description:
        "Regulated staking and node operator serving 12 proof-of-stake networks.",
      sellerIndex: 1,
    },
    {
      title: "MedGate Payments",
      licenseType: "PI",
      jurisdiction: "MT",
      price: 640_000,
      description:
        "Payment institution specialised in healthcare and insurance disbursements.",
      sellerIndex: 1,
    },
    {
      title: "Tallinn Neobank",
      licenseType: "EMI",
      jurisdiction: "EE",
      price: 2_950_000,
      description:
        "Estonian e-residency neobank with 25k customers and banking API sandbox.",
      sellerIndex: 2,
    },
    {
      title: "Estonian Factoring Plus",
      licenseType: "PI",
      jurisdiction: "EE",
      price: 720_000,
      description: "Invoice factoring platform with SEPA direct debit licence.",
      sellerIndex: 2,
    },
    {
      title: "Nordic VASP OÜ",
      licenseType: "VASP",
      jurisdiction: "EE",
      price: 1_150_000,
      description:
        "Estonian crypto-to-fiat gateway with institutional KYT tooling.",
      sellerIndex: 2,
    },
    {
      title: "Baltic BNPL",
      licenseType: "PI",
      jurisdiction: "EE",
      price: 1_750_000,
      description:
        "Buy-now-pay-later provider with 9% NPL rate and 200+ merchant partners.",
      sellerIndex: 2,
    },
    {
      title: "Vistula Payments",
      licenseType: "PI",
      jurisdiction: "PL",
      price: 1_600_000,
      description:
        "Polish payment institution with recurring billing and direct debit focus.",
      sellerIndex: 2,
    },
    {
      title: "Warsaw Crypto Desk",
      licenseType: "VASP",
      jurisdiction: "PL",
      price: 560_000,
      description:
        "OTC virtual asset broker registered in Poland, small but profitable team.",
      sellerIndex: 2,
    },
    {
      title: "Wisla Open Banking",
      licenseType: "PI",
      jurisdiction: "PL",
      price: 2_200_000,
      description:
        "AIS/PISP licensed aggregator with 30+ bank integrations in CEE.",
      sellerIndex: 2,
    },
    {
      title: "Riga Settlement House",
      licenseType: "EMI",
      jurisdiction: "LT",
      price: 150_000,
      description:
        "Early-stage EMI with sandbox licence — turnaround opportunity, ops need restructuring.",
      sellerIndex: 0,
    },
    // Non-published assets for manager/seller views:
    {
      title: "Paphos Brokerage Licence",
      licenseType: "PI",
      jurisdiction: "CY",
      price: 480_000,
      description:
        "Payment institution draft listing — financials still under review.",
      sellerIndex: 1,
      status: "DRAFT",
    },
    {
      title: "Gdansk Acquiring",
      licenseType: "PI",
      jurisdiction: "PL",
      price: 1_050_000,
      description:
        "Merchant acquiring PI, paused while seller renegotiates staff retention terms.",
      sellerIndex: 2,
      status: "PAUSED",
    },
  ];

  const assets = await Promise.all(
    assetSeeds.map((a) =>
      prisma.asset.create({
        data: {
          sellerId: sellers[a.sellerIndex].id,
          title: a.title,
          licenseType: a.licenseType,
          jurisdiction: a.jurisdiction,
          price: a.price,
          currency: "EUR",
          description: a.description,
          status: a.status ?? "PUBLISHED",
        },
      }),
    ),
  );

  // --- Inquiries: 8, unique (assetId, buyerId) pairs ------------------------

  const inquirySeeds: Array<{
    assetIndex: number;
    buyerIndex: number;
    message: string;
  }> = [
    {
      assetIndex: 0,
      buyerIndex: 0,
      message:
        "Interested in Nordic Pay EMI. Could you share audited financials for the last two years and details on the passporting coverage?",
    },
    {
      assetIndex: 3,
      buyerIndex: 3,
      message:
        "We are looking at Fintech Hub Vilnius as a platform acquisition. Is the management team open to staying post-close?",
    },
    {
      assetIndex: 4,
      buyerIndex: 1,
      message:
        "PayCy fits our MICA strategy. Could you share the current take rate and the split between issuing and acquiring revenue?",
    },
    {
      assetIndex: 7,
      buyerIndex: 1,
      message:
        "Regarding Island Token Markets: has the CASP application been submitted under MiCA already, or is it still pending?",
    },
    {
      assetIndex: 10,
      buyerIndex: 0,
      message:
        "Tallinn Neobank looks interesting. How dependent is the business on the e-residency channel?",
    },
    {
      assetIndex: 13,
      buyerIndex: 2,
      message:
        "Baltic BNPL — can you disclose the vintage performance of the loan book and the funding structure?",
    },
    {
      assetIndex: 16,
      buyerIndex: 4,
      message:
        "Wisla Open Banking is above our budget, but strategic. Would you consider a staged payment over 18 months?",
    },
    {
      assetIndex: 17,
      buyerIndex: 4,
      message:
        "Riga Settlement House at 150k catches our eye as a turnaround case. What exactly triggered the licence conditions?",
    },
  ];

  await prisma.inquiry.createMany({
    data: inquirySeeds.map((i) => ({
      assetId: assets[i.assetIndex].id,
      buyerId: buyers[i.buyerIndex].id,
      initiatorRole: "BUYER" as const,
      message: i.message,
    })),
  });

  // --- Seller → buyer messages (opposite direction of Inquiry) --------------

  await prisma.inquiry.createMany({
    data: [
      {
        assetId: assets[0].id,
        buyerId: buyers[0].id,
        initiatorRole: "SELLER" as const,
        message:
          "Happy to share the audited statements. Nordic Pay is profitable since 2021, 40k active accounts, full EEA passporting via the Lithuanian passporting regime.",
        readAt: new Date(),
      },
      {
        assetId: assets[7].id,
        buyerId: buyers[1].id,
        initiatorRole: "SELLER" as const,
        message:
          "The MiCA CASP application was submitted in Q1 and is still pending — the ART issuance framework is already in place.",
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    buyerProfiles: await prisma.buyerProfile.count(),
    assets: await prisma.asset.count(),
    inquiries: await prisma.inquiry.count(),
  };
  console.log("Seed complete:", counts);
  console.log("Login: any seeded email / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
