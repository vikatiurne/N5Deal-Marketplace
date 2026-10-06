/** buyer zone strings (en). Filled in by the zone translation pass. */
export const buyer = {
  // Buyer nav
  "buyer.nav.ariaLabel": "Buyer",
  "buyer.nav.dashboard": "Dashboard",
  "buyer.nav.profile": "My profile",
  "buyer.nav.inquiries": "Inquiries",
  "buyer.nav.browse": "Browse marketplace →",

  // Dashboard
  "buyer.dashboard.meta.title": "Buyer workspace",
  "buyer.dashboard.title": "Buyer workspace",
  "buyer.dashboard.overviewLabel": "Overview",
  "buyer.dashboard.inquiries.title": "Inquiries sent",
  "buyer.dashboard.inquiries.description":
    "Contact requests you sent to sellers.",
  "buyer.dashboard.inquiries.view": "View inquiries",
  "buyer.dashboard.matchedLabel": "Matched assets",
  "buyer.dashboard.matched.title": "Matched for you",
  "buyer.dashboard.matched.browse": "Browse all assets",
  "buyer.dashboard.matchedOn": "Matched on",
  "buyer.dashboard.matched.hint":
    "Add jurisdictions, license types and a budget to your profile to get matched listings here.",
  "buyer.dashboard.empty.title": "No published assets match yet",
  "buyer.dashboard.empty.description":
    "Widen your budget or jurisdictions, or send an inquiry to a seller from the marketplace.",
  "buyer.dashboard.empty.adjust": "Adjust interests",
  "buyer.dashboard.empty.browse": "Browse all assets",
  "buyer.dashboard.showing":
    "Showing up to {limit} of the newest published listings.",
  "buyer.dashboard.formula": "license ∩ jurisdiction ∩ budget",

  // Dashboard: matched-criteria fragments (built from MatchCriteria)
  "buyer.criteria.jurisdiction": "jurisdiction {codes}",
  "buyer.criteria.license": "license {types}",
  "buyer.criteria.from": "from €{amount}",
  "buyer.criteria.upTo": "up to €{amount}",

  // Loading
  "buyer.loading": "Loading buyer workspace",

  // Profile completeness card
  "buyer.completeness.title": "Profile completeness",
  "buyer.completeness.complete": "Complete",
  "buyer.completeness.incomplete": "Incomplete",
  "buyer.completeness.completeDescription":
    "Sellers can find you in the buyer directory.",
  "buyer.completeness.incompleteDescription":
    "A complete profile gets you matched with relevant listings.",
  "buyer.completeness.missing": "Missing: {fields}.",
  "buyer.completeness.edit": "Edit profile",

  // Profile completeness: missing-field labels
  "buyer.field.company": "Company",
  "buyer.field.jurisdictions": "Jurisdictions",
  "buyer.field.licenseTypes": "License types",
  "buyer.field.budget": "Budget",

  // Profile page
  "buyer.profile.meta.title": "Buyer profile",
  "buyer.profile.title": "My profile",
  "buyer.profile.subtitle":
    "Tell sellers what you are looking for — the same criteria power your matched listings.",

  // Profile form
  "buyer.profile.company": "Company",
  "buyer.profile.jurisdictions": "Jurisdictions of interest",
  "buyer.profile.jurisdictionsHint":
    "Licences in these countries are matched to your dashboard.",
  "buyer.profile.licenseTypes": "License types of interest",
  "buyer.profile.budgetMin": "Budget from (EUR)",
  "buyer.profile.budgetMax": "Budget up to (EUR)",
  "buyer.profile.descriptionLabel": "Acquisition interests",
  "buyer.profile.counter": "{count} / min {min}",
  "buyer.profile.descriptionPlaceholder":
    "Looking for an established EMI in the Baltics with passporting rights across the EEA…",
  "buyer.profile.tooShort":
    "Add a bit more detail — at least {min} characters.",
  "buyer.profile.saving": "Saving…",
  "buyer.profile.save": "Save profile",
  "buyer.profile.hint":
    "Interests drive your matched listings on the dashboard.",
  "buyer.profile.saveError": "Could not save profile.",
  "buyer.profile.toastFailedTitle": "Profile not saved",
  "buyer.profile.toastFailedDescription": "Check the fields and try again.",
  "buyer.profile.toastSavedTitle": "Profile saved",
  "buyer.profile.toastSavedDescription":
    "Your dashboard now matches assets to these interests.",

  // Inquiries page
  "buyer.inquiries.meta.title": "My inquiries",
  "buyer.inquiries.title": "My inquiries",
  "buyer.inquiries.count":
    "{count} inquiries · sellers reply out of band, contact details are never shared here.",
  "buyer.inquiries.count_one":
    "{count} inquiry · sellers reply out of band, contact details are never shared here.",
  "buyer.inquiries.empty.title": "No inquiries yet",
  "buyer.inquiries.empty.description":
    "Open a listing and send the seller a message — it will appear here with its status.",
  "buyer.inquiries.empty.browse": "Browse assets",
  "buyer.inquiries.sent": "Sent",
  "buyer.inquiries.assetStatus": "asset {status}",
};
