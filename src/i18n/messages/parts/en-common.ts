/**
 * Shared catalog: chrome, roles, statuses, licence labels, generic form words.
 * Source of truth for the MessageKey union (re-exported via messages/en.ts).
 */
export const common = {
  // Common
  "common.role.buyer": "Buyer",
  "common.role.seller": "Seller",
  "common.role.manager": "Manager",
  "common.loading": "Loading…",
  "common.back": "Back",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.retry": "Try again",
  "common.search": "Search",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.status": "Status",
  "common.role": "Role",
  "common.name": "Name",
  "common.email": "Email",
  "common.price": "Price",
  "common.created": "Created",
  "common.updated": "Updated",
  "common.actions": "Actions",
  "common.description": "Description",
  "common.all": "All",

  // Number/currency helpers
  "format.priceOnRequest": "Price on request",
  "format.budgetNotSpecified": "Budget not specified",
  "format.from": "from",
  "format.upTo": "up to",

  // Error / 404 pages
  "error.notFound.title": "Page not found",
  "error.notFound.description":
    "This listing may have been removed or paused, or the link is wrong. Every published asset is still listed in the marketplace.",
  "error.notFound.goHome": "Go home",
  "error.boundary.title": "Something went wrong",
  "error.boundary.description":
    "This page failed to render. Try again — if it keeps failing, the error is in the server log.",
  "error.boundary.retry": "Try again",
  "error.boundary.backToListings": "Back to listings",

  // Header / navigation
  "nav.browseAssets": "Browse assets",
  "nav.forBuyers": "For buyers",
  "nav.forSellers": "For sellers",
  "nav.manager": "Manager",
  "nav.signIn": "Sign in",
  "nav.register": "Register",
  "nav.dashboard": "My dashboard",
  "nav.menu": "Menu",
  "nav.logout": "Logout",
  "nav.openMenu": "Open main menu",
  "nav.mainLabel": "Main",
  "nav.mobileLabel": "Mobile",
  "nav.homeLabel": "N5Deal — home",
  "nav.signedInAs": "{email} · {role}",
  "nav.guestHint": "Sign in or create an account to reach your dashboard.",

  // Language switcher
  "switcher.ariaLabel": "Language",
  "switcher.en": "EN",
  "switcher.uk": "UA",
  "switcher.toEn": "Switch to English",
  "switcher.toUk": "Перейти українською",

  // Footer
  "footer.build": "Test assignment build — N5Deal Marketplace",
  "footer.notAffiliated": "Not affiliated with n5deal.com",

  // Metadata
  "meta.title.default": "N5Deal — FinTech & M&A asset marketplace",
  "meta.description":
    "Mini-marketplace for buying and selling licensed fintech companies.",

  // Landing page
  "home.badge": "Test assignment build",
  "home.title": "N5Deal — marketplace for FinTech & M&A assets",
  "home.subtitle":
    "Buy and sell licensed fintech companies: EMI, PI, MiCA CASP and more. Persistent demo data, role-based workspaces, AI-assisted search.",
  "home.browseAssets": "Browse assets",
  "home.login": "Login",
  "home.createAccount": "Create account",
  "home.rolesLabel": "Roles",
  "home.roleBuyerTitle": "Buyer",
  "home.roleBuyerDescription":
    "Find licensed fintech companies, filter by license type and jurisdiction, contact sellers.",
  "home.roleBuyerCta": "Browse assets",
  "home.roleSellerTitle": "Seller",
  "home.roleSellerDescription":
    "Publish assets, browse buyer profiles and respond to incoming inquiries.",
  "home.roleSellerCta": "Open seller workspace",
  "home.roleManagerTitle": "Platform Manager",
  "home.roleManagerDescription":
    "Moderate members and assets, search and filter the platform, manage compliance.",
  "home.roleManagerCta": "Open manager console",

  // Shared label maps (badgeStyles values → keys)
  "common.license.emi": "EMI",
  "common.license.pi": "PI",
  "common.license.micaCasp": "MiCA CASP",
  "common.license.vasp": "VASP",
  "common.license.bank": "Bank",
  "common.license.other": "Other",
  "common.assetStatus.draft": "Draft",
  "common.assetStatus.published": "Published",
  "common.assetStatus.paused": "Paused",
  "common.assetStatus.removed": "Removed",
  "common.userStatus.active": "Active",
  "common.userStatus.suspended": "Suspended",
  "common.userStatus.deleted": "Deleted",
};
