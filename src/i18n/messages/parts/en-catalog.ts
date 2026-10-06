/** Public catalog: list page, detail page, filters, smart search, contact. */
export const catalog = {
  // Catalog: list page
  "assets.meta.title": "Browse assets",
  "assets.meta.description": "Browse licensed fintech companies for sale.",
  "assets.heading": "Browse assets",
  "assets.count.none": "No published assets",
  "assets.count": "{count} published assets",
  "assets.count_one": "{count} published asset",
  "assets.gridLabel": "Asset listings",
  "assets.empty.title": "No assets match your filters",
  "assets.empty.description":
    "Try widening the price range, removing a license type, or clearing the search text.",
  "assets.empty.reset": "Reset filters",
  "assets.loading": "Loading asset listings",

  // Catalog: detail page
  "assets.back": "← Back to listings",
  "assets.about": "About this asset",
  "assets.sellerCard": "Seller",
  "assets.sellerFallback": "Seller",
  "assets.loginToContact": "Login to contact seller",
  "assets.edit": "Edit asset",
  "assets.view": "View →",
  "assets.notFound": "Asset not found",
  "assets.metaDetail.description": "{license} in {jurisdiction} — {price}",

  // Catalog: filters
  "filters.search": "Search",
  "filters.qPlaceholder": "Title or description…",
  "filters.minPrice": "Min price (EUR)",
  "filters.maxPrice": "Max price (EUR)",
  "filters.apply": "Apply",
  "filters.reset": "Reset",
  "filters.licenseType": "License type",
  "filters.jurisdiction": "Jurisdiction",
  "filters.sortBy": "Sort by",
  "filters.sort.newest": "Newest",
  "filters.sort.price_asc": "Price: low to high",
  "filters.sort.price_desc": "Price: high to low",

  // Catalog: smart search
  "smart.label": "Describe what you are looking for",
  "smart.placeholder": "e.g. EMI license in Lithuania under €500k",
  "smart.ask": "Ask AI",
  "smart.hint":
    "AI turns your sentence into licence, country and price filters — refine them with the filters below.",
  "smart.tooShort.title": "Add a bit more detail",
  "smart.tooShort.description": "Describe licence, country, budget or sector.",
  "smart.rate.title": "Slow down a moment",
  "smart.rate.description": "AI search limit reached. Try again shortly.",
  "smart.unavailable.title": "AI search unavailable",
  "smart.unavailable.description": "Falling back to keyword search.",
  "smart.degraded.title": "AI parsing unavailable",
  "smart.degraded.description": "Searched your words as keywords instead.",

  // Catalog: AI banner
  "ai.label": "AI interpreted your query as:",
  "ai.dismiss": "Dismiss AI interpretation",

  // Pagination
  "pagination.label": "Pagination",
  "pagination.prev": "← Prev",
  "pagination.next": "Next →",
  "pagination.prevLabel": "Previous page",
  "pagination.nextLabel": "Next page",

  // Contact seller dialog
  "contact.button": "Contact seller",
  "contact.title": "Contact seller",
  "contact.description":
    "Send an inquiry about “{assetTitle}” to {sellerName}. Seller contact details stay private — the platform relays your message.",
  "contact.messageLabel": "Your message",
  "contact.counter": "{count} / min {min}",
  "contact.placeholder":
    "We are interested in this licence. Could you share the last two years of audited financials and details on the regulatory history?",
  "contact.tooShort": "Add a bit more detail — at least {min} characters.",
  "contact.cancel": "Cancel",
  "contact.sending": "Sending…",
  "contact.send": "Send inquiry",
  "contact.sent.title": "Inquiry sent",
  "contact.sent.description":
    "{sellerName} will see your message about “{assetTitle}”.",
  "contact.failed.title": "Inquiry not sent",
  "contact.failed.description": "Please try again.",
  "contact.sentBadge": "Inquiry sent ✓",
};
