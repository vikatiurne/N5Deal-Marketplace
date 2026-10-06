import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  countAssetsByStatus,
  findAssetById,
  findOwnedAsset,
  listAssets,
  listAssetsBySeller,
  listAssetsForManager,
  listSellerAssets,
} from "@/lib/db/repositories/assets";
import { prisma } from "@/lib/db/prisma";
import type { AssetStatus, LicenseType } from "@/types";

/**
 * Filter tests run against a real SQLite file (prisma/test.db) rather than a
 * mocked Prisma client: the unit under test is the `where` clause Prisma
 * builds from these arguments, so mocking the client would mock the very thing
 * being verified. See test/globalSetup.ts.
 */

const SELLER_ID = "user-seller-fixture";
const OTHER_SELLER_ID = "user-seller-other";

interface Fixture {
  title: string;
  licenseType: LicenseType;
  jurisdiction: string;
  price: number | null;
  status: AssetStatus;
  description: string;
}

/** Deliberately spread over licences, countries, prices and statuses. */
const FIXTURES: Fixture[] = [
  {
    title: "Baltic EMI with passporting",
    licenseType: "EMI",
    jurisdiction: "LT",
    price: 450_000,
    status: "PUBLISHED",
    description: "Established electronic money institution, EEA passporting.",
  },
  {
    title: "Cyprus EMI boutique",
    licenseType: "EMI",
    jurisdiction: "CY",
    price: 1_200_000,
    status: "PUBLISHED",
    description: "Small EMI, EU settlement licence, crypto on-ramp.",
  },
  {
    title: "Malta PI issuer",
    licenseType: "PI",
    jurisdiction: "MT",
    price: 3_000_000,
    status: "PUBLISHED",
    description: "Payment institution with a banking partner in Riga.",
  },
  {
    title: "Estonian VASP",
    licenseType: "VASP",
    jurisdiction: "EE",
    price: 250_000,
    status: "PAUSED",
    description: "Virtual asset service provider, paused pending review.",
  },
  {
    title: "Lithuanian bank in wind-down",
    licenseType: "BANK",
    jurisdiction: "LT",
    price: null,
    status: "DRAFT",
    description: "Draft listing, price on request.",
  },
  {
    title: "MiCA CASP applicant",
    licenseType: "MICA_CASP",
    jurisdiction: "LT",
    price: 750_000,
    status: "PUBLISHED",
    description: "Pre-application stage, MiCA CASP licensing in progress.",
  },
  {
    title: "EMI with a very cheap price",
    licenseType: "EMI",
    jurisdiction: "EE",
    price: 90_000,
    status: "PUBLISHED",
    description: "Substring bait for the search test: EMI mentioning EMI.",
  },
];

const createdIds: string[] = [];
const byTitle = new Map<string, string>();

beforeAll(async () => {
  await prisma.user.createMany({
    data: [
      {
        id: SELLER_ID,
        email: "seller-fixture@n5deal.test",
        passwordHash: "x",
        displayName: "Fixture Seller",
        role: "SELLER",
        status: "ACTIVE",
      },
      {
        id: OTHER_SELLER_ID,
        email: "seller-other@n5deal.test",
        passwordHash: "x",
        displayName: "Other Seller",
        role: "SELLER",
        status: "SUSPENDED",
      },
    ],
  });

  for (const [index, fixture] of FIXTURES.entries()) {
    // Stagger createdAt so "newest" ordering is deterministic.
    const created = await prisma.asset.create({
      data: {
        sellerId: index === 1 ? OTHER_SELLER_ID : SELLER_ID,
        currency: "EUR",
        createdAt: new Date(Date.UTC(2024, 0, index + 1)),
        ...fixture,
      },
    });
    createdIds.push(created.id);
    byTitle.set(fixture.title, created.id);
  }
});

afterAll(async () => {
  await prisma.asset.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.user.deleteMany({
    where: {
      id: { in: [SELLER_ID, OTHER_SELLER_ID, "user-buyer-a", "user-buyer-b"] },
    },
  });
  await prisma.$disconnect();
});

const titles = (rows: { title: string }[]) => rows.map((r) => r.title).sort();

describe("listAssets — status and visibility", () => {
  it("returns only PUBLISHED by default is not applied — status is opt-in", async () => {
    // The repository is dumb about visibility on purpose: the public page
    // passes status explicitly, the seller page filters by sellerId instead.
    const all = await listAssets({ pageSize: 100 });
    expect(all.total).toBe(FIXTURES.length);
    expect(titles(all.items)).toHaveLength(FIXTURES.length);
  });

  it("filters to PUBLISHED listings", async () => {
    const result = await listAssets({ status: "PUBLISHED", pageSize: 100 });
    expect(result.total).toBe(5);
    expect(result.items.every((a) => a.status === "PUBLISHED")).toBe(true);
  });

  it("reports the total independently of the page size", async () => {
    const page = await listAssets({
      status: "PUBLISHED",
      page: 1,
      pageSize: 2,
    });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(5);
  });

  it("returns an empty page past the last one without losing the total", async () => {
    const page = await listAssets({ page: 99, pageSize: 10 });
    expect(page.items).toHaveLength(0);
    expect(page.total).toBe(FIXTURES.length);
  });
});

describe("listAssets — licence and jurisdiction", () => {
  it("matches a single licence type", async () => {
    const result = await listAssets({ licenseType: ["EMI"], pageSize: 100 });
    expect(result.total).toBe(3);
    expect(result.items.every((a) => a.licenseType === "EMI")).toBe(true);
  });

  it("matches several licence types (OR, not AND)", async () => {
    const result = await listAssets({
      licenseType: ["PI", "VASP"],
      pageSize: 100,
    });
    expect(titles(result.items)).toEqual(["Estonian VASP", "Malta PI issuer"]);
  });

  it("matches several jurisdictions", async () => {
    const result = await listAssets({
      jurisdiction: ["LT", "EE"],
      pageSize: 100,
    });
    expect(result.total).toBe(5);
    expect(
      result.items.every((a) => ["LT", "EE"].includes(a.jurisdiction)),
    ).toBe(true);
  });

  it("combines licence and jurisdiction (AND across dimensions)", async () => {
    const result = await listAssets({
      licenseType: ["EMI"],
      jurisdiction: ["LT"],
      pageSize: 100,
    });
    expect(titles(result.items)).toEqual(["Baltic EMI with passporting"]);
  });

  it("ignores an empty filter array instead of matching nothing", async () => {
    const all = await listAssets({ pageSize: 100 });
    const empty = await listAssets({
      licenseType: [],
      jurisdiction: [],
      pageSize: 100,
    });
    expect(empty.total).toBe(all.total);
  });

  it("returns nothing for an unknown licence combination", async () => {
    const result = await listAssets({
      licenseType: ["PI"],
      jurisdiction: ["LT"],
      pageSize: 100,
    });
    expect(result).toEqual({ items: [], total: 0 });
  });
});

describe("listAssets — price range", () => {
  it("applies priceMin inclusively", async () => {
    const result = await listAssets({ priceMin: 750_000, pageSize: 100 });
    expect(titles(result.items)).toEqual([
      "Cyprus EMI boutique",
      "Malta PI issuer",
      "MiCA CASP applicant",
    ]);
  });

  it("applies priceMax inclusively", async () => {
    const result = await listAssets({ priceMax: 250_000, pageSize: 100 });
    expect(titles(result.items)).toEqual([
      "EMI with a very cheap price",
      "Estonian VASP",
    ]);
  });

  it("applies both bounds", async () => {
    const result = await listAssets({
      priceMin: 90_000,
      priceMax: 500_000,
      pageSize: 100,
    });
    expect(titles(result.items)).toEqual([
      "Baltic EMI with passporting",
      "EMI with a very cheap price",
      "Estonian VASP",
    ]);
  });

  it("treats price 0 as a real bound, not as absent", async () => {
    const result = await listAssets({ priceMax: 0, pageSize: 100 });
    expect(result.total).toBe(0);
  });

  it("excludes listings with no price from a bounded range", async () => {
    const bounded = await listAssets({ priceMax: 5_000_000, pageSize: 100 });
    // "Lithuanian bank in wind-down" has price=null and must not appear.
    expect(
      bounded.items.some((a) => a.title === "Lithuanian bank in wind-down"),
    ).toBe(false);
    const unbounded = await listAssets({ pageSize: 100 });
    expect(
      unbounded.items.some((a) => a.title === "Lithuanian bank in wind-down"),
    ).toBe(true);
  });

  it("returns nothing for an empty range", async () => {
    const result = await listAssets({
      priceMin: 10_000_000,
      priceMax: 20_000_000,
      pageSize: 100,
    });
    expect(result).toEqual({ items: [], total: 0 });
  });
});

describe("listAssets — free text search", () => {
  it("matches the title", async () => {
    const result = await listAssets({ q: "passporting", pageSize: 100 });
    expect(titles(result.items)).toEqual(["Baltic EMI with passporting"]);
  });

  it("matches the description", async () => {
    const result = await listAssets({ q: "substr", pageSize: 100 });
    // "Substring bait" only appears in the description, not the title.
    expect(titles(result.items)).toEqual(["EMI with a very cheap price"]);
  });

  it("is a case-insensitive substring on either field", async () => {
    const lower = await listAssets({ q: "malta", pageSize: 100 });
    const upper = await listAssets({ q: "MALTA", pageSize: 100 });
    expect(lower.total).toBe(1);
    expect(upper.total).toBe(1);
  });

  it("searches title OR description, so a term split across both still matches", async () => {
    const result = await listAssets({ q: "passporting", pageSize: 100 });
    expect(result.total).toBe(1);
  });

  it("returns nothing when no row contains the term", async () => {
    const result = await listAssets({
      q: "blockchain-adjacent-unicorn",
      pageSize: 100,
    });
    expect(result).toEqual({ items: [], total: 0 });
  });

  it("KNOWN LIMITATION: % in the query acts as a LIKE wildcard", async () => {
    // SQLite does not escape wildcards inside a bound LIKE parameter, so a
    // search for "%" returns the whole catalogue instead of nothing. Documented
    // in ARCHITECTURE.md — escaping needs `mode` support SQLite lacks.
    const result = await listAssets({ q: "%", pageSize: 100 });
    expect(result.total).toBe(FIXTURES.length);
  });

  it("still escapes quote characters — no SQL injection through `q`", async () => {
    const injection = await listAssets({
      q: "'; DROP TABLE Asset; --",
      pageSize: 100,
    });
    expect(injection).toEqual({ items: [], total: 0 });
    // The table is still there afterwards.
    expect((await listAssets({ pageSize: 100 })).total).toBe(FIXTURES.length);
  });
});

describe("listAssets — sorting", () => {
  it("defaults to newest first", async () => {
    const result = await listAssets({ pageSize: 100 });
    expect(result.items[0]?.title).toBe("EMI with a very cheap price");
  });

  it("sorts by price ascending", async () => {
    const result = await listAssets({ sort: "price_asc", pageSize: 100 });
    const prices = result.items.map((a) => a.price);
    const numeric = prices.filter((p): p is number => p !== null);
    expect(numeric).toEqual([...numeric].sort((a, b) => a - b));
  });

  it("sorts by price descending", async () => {
    const result = await listAssets({ sort: "price_desc", pageSize: 100 });
    expect(result.items[0]?.title).toBe("Malta PI issuer");
  });

  it("keeps the total while sorting", async () => {
    const result = await listAssets({ sort: "price_asc", pageSize: 3 });
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(FIXTURES.length);
  });
});

describe("listAssets — pagination", () => {
  it("does not repeat or skip rows across pages", async () => {
    const size = 3;
    const seen: string[] = [];
    for (let page = 1; page <= 3; page++) {
      const result = await listAssets({ page, pageSize: size });
      seen.push(...result.items.map((a) => a.id));
    }
    expect(seen).toHaveLength(FIXTURES.length);
    expect(new Set(seen).size).toBe(FIXTURES.length);
  });

  it("combines page with filters and keeps the filtered total", async () => {
    const page = await listAssets({
      status: "PUBLISHED",
      page: 2,
      pageSize: 2,
    });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(5);
  });
});

describe("listAssets — seller scoping", () => {
  it("returns only that seller's assets", async () => {
    const result = await listAssets({ sellerId: SELLER_ID, pageSize: 100 });
    expect(result.total).toBe(FIXTURES.length - 1);
    expect(result.items.every((a) => a.sellerId === SELLER_ID)).toBe(true);
  });

  it("can combine seller scope with a status filter", async () => {
    const result = await listAssets({
      sellerId: SELLER_ID,
      status: "DRAFT",
      pageSize: 100,
    });
    expect(titles(result.items)).toEqual(["Lithuanian bank in wind-down"]);
  });
});

describe("ownership queries", () => {
  it("findAssetById returns the row", async () => {
    const id = byTitle.get("Malta PI issuer")!;
    const asset = await findAssetById(id);
    expect(asset?.title).toBe("Malta PI issuer");
    expect(asset?.price).toBe(3_000_000);
  });

  it("findAssetById returns null for an unknown id instead of throwing", async () => {
    expect(await findAssetById("does-not-exist")).toBeNull();
  });

  it("findOwnedAsset returns the row for the owning seller", async () => {
    const id = byTitle.get("Malta PI issuer")!;
    expect((await findOwnedAsset(id, SELLER_ID))?.id).toBe(id);
  });

  it("findOwnedAsset returns null for a different seller", async () => {
    const id = byTitle.get("Malta PI issuer")!;
    expect(await findOwnedAsset(id, OTHER_SELLER_ID)).toBeNull();
  });
});

describe("countAssetsByStatus", () => {
  it("counts every status and defaults missing ones to zero", async () => {
    const counts = await countAssetsByStatus();
    expect(counts.PUBLISHED).toBe(5);
    expect(counts.PAUSED).toBe(1);
    expect(counts.DRAFT).toBe(1);
    expect(counts.REMOVED).toBe(0);
  });

  it("scopes to one seller", async () => {
    const counts = await countAssetsByStatus(SELLER_ID);
    expect(counts.PUBLISHED).toBe(4);
    expect(counts.PAUSED).toBe(1);
    expect(counts.DRAFT).toBe(1);
  });
});

describe("listAssetsBySeller", () => {
  it("returns the seller's assets newest first", async () => {
    const rows = await listAssetsBySeller(SELLER_ID);
    expect(rows[0]?.title).toBe("EMI with a very cheap price");
    expect(rows.every((r) => r.sellerId === SELLER_ID)).toBe(true);
  });

  it("returns an empty array for a seller with no assets", async () => {
    expect(await listAssetsBySeller("user-without-assets")).toEqual([]);
  });
});

describe("listSellerAssets — inquiry counters", () => {
  const assetId = () => byTitle.get("Baltic EMI with passporting")!;
  let inquiryIds: string[] = [];

  beforeEach(async () => {
    if (inquiryIds.length > 0) {
      await prisma.inquiry.deleteMany({ where: { id: { in: inquiryIds } } });
      inquiryIds = [];
    }
  });

  it("reports zero for an asset with no inquiries", async () => {
    const rows = await listSellerAssets(SELLER_ID);
    const row = rows.find((r) => r.id === assetId())!;
    expect(row.inquiryCount).toBe(0);
    expect(row.unreadCount).toBe(0);
  });

  it("separates total from unread", async () => {
    // The schema allows one inquiry per (asset, buyer, direction), so a second
    // message from the same buyer has to come from another account.
    const buyers = await Promise.all([
      prisma.user.create({
        data: {
          id: "user-buyer-a",
          email: "buyer-a@n5deal.test",
          passwordHash: "x",
          displayName: "Buyer A",
          role: "BUYER",
          status: "ACTIVE",
        },
      }),
      prisma.user.create({
        data: {
          id: "user-buyer-b",
          email: "buyer-b@n5deal.test",
          passwordHash: "x",
          displayName: "Buyer B",
          role: "BUYER",
          status: "ACTIVE",
        },
      }),
    ]);

    const first = await prisma.inquiry.create({
      data: {
        assetId: assetId(),
        buyerId: buyers[0].id,
        initiatorRole: "BUYER",
        message: "First question with enough characters to be valid.",
        readAt: null,
      },
    });
    const second = await prisma.inquiry.create({
      data: {
        assetId: assetId(),
        buyerId: buyers[1].id,
        initiatorRole: "BUYER",
        message: "Second question, already read by the seller.",
        readAt: new Date(),
      },
    });
    inquiryIds = [first.id, second.id];

    const rows = await listSellerAssets(SELLER_ID);
    const row = rows.find((r) => r.id === assetId())!;
    expect(row.inquiryCount).toBe(2);
    expect(row.unreadCount).toBe(1);
  });

  it("ignores seller-initiated inquiries in the counters", async () => {
    const buyer = await prisma.user.findUniqueOrThrow({
      where: { id: "user-buyer-a" },
    });
    const sellerInitiated = await prisma.inquiry.create({
      data: {
        assetId: assetId(),
        buyerId: buyer.id,
        initiatorRole: "SELLER",
        message: "Seller reaching out to the buyer, not a buyer inquiry.",
        readAt: null,
      },
    });
    inquiryIds = [sellerInitiated.id];

    const row = (await listSellerAssets(SELLER_ID)).find(
      (r) => r.id === assetId(),
    )!;
    expect(row.inquiryCount).toBe(0);
    expect(row.unreadCount).toBe(0);
  });
});

describe("listAssetsForManager — seller snapshot", () => {
  it("joins the seller onto each row", async () => {
    const page = await listAssetsForManager({ pageSize: 100 });
    const row = page.items.find((a) => a.title === "Cyprus EMI boutique")!;
    expect(row.seller.displayName).toBe("Other Seller");
    expect(row.seller.status).toBe("SUSPENDED");
  });

  it("keeps the filtered total", async () => {
    const page = await listAssetsForManager({ status: "PUBLISHED" });
    expect(page.total).toBe(5);
  });

  it("returns an empty page without a second query", async () => {
    const page = await listAssetsForManager({
      q: "no such asset anywhere",
      pageSize: 10,
    });
    expect(page).toEqual({ items: [], total: 0 });
  });
});
