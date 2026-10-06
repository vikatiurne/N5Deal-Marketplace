/** seller zone strings (en). Filled in by the zone translation pass. */
export const seller = {
  // Shared across the zone
  "seller.assets.new": "New asset",
  "seller.assets.title": "My assets",
  "seller.buyers.title": "Buyers",
  "seller.inquiry.unread": "Unread",
  "seller.inquiry.read": "Read",

  // Dashboard
  "seller.dashboard.title": "Seller workspace",
  "seller.dashboard.byStatusAria": "Listings by status",
  "seller.dashboard.listingsTitle": "Listings",
  "seller.dashboard.listingsDescription": "Your assets by publication status.",
  "seller.dashboard.manageAssets": "Manage assets",
  "seller.dashboard.inquiriesTitle": "Inquiries received",
  "seller.dashboard.inquiriesDescription":
    "Buyer contact requests across all your listings.",
  "seller.dashboard.unreadInLatest": "{count} unread in latest {total}",
  "seller.dashboard.openInbox": "Open inbox",
  "seller.dashboard.latestTitle": "Latest inquiries",
  "seller.dashboard.viewAll": "View all",
  "seller.dashboard.empty.title": "No inquiries yet",
  "seller.dashboard.empty.description":
    "Publish a listing and buyers will find it.",
  "seller.dashboard.empty.action": "Create a listing",

  // Loading skeleton
  "seller.loading.dashboard": "Loading seller dashboard",

  // Assets list
  "seller.assets.subtitle":
    "{count} listings · only published ones appear on the public marketplace.",
  "seller.assets.subtitle_one":
    "{count} listing · only published ones appear on the public marketplace.",
  "seller.assets.empty.title": "No listings yet",
  "seller.assets.empty.description":
    "Publish your first licensed entity to reach buyers.",
  "seller.assets.empty.action": "Create an asset",
  "seller.assets.caption":
    "Your listings. Only published assets are visible to buyers.",
  "seller.assets.col.title": "Title",
  "seller.assets.col.license": "License",
  "seller.assets.col.jurisdiction": "Jurisdiction",
  "seller.assets.col.inquiries": "Inquiries",
  "seller.assets.newBadge": "{count} new",

  // New asset page
  "seller.assets.new.subtitle":
    "Save a draft first and publish when the financials are ready.",

  // Edit asset page
  "seller.assets.edit.title": "Edit asset",
  "seller.assets.edit.back": "← Back to my assets",
  "seller.assets.edit.viewPublic": "View public page",

  // Buyers list
  "seller.buyers.subtitle.none": "No buyers match the filters",
  "seller.buyers.subtitle": "{count} buyers with a public profile",
  "seller.buyers.subtitle_one": "{count} buyer with a public profile",
  "seller.buyers.empty.title": "No buyers match",
  "seller.buyers.empty.description":
    "Widen the budget range or clear the jurisdiction and license filters.",
  "seller.buyers.empty.action": "Reset filters",
  "seller.buyers.viewProfile": "View profile",

  // Buyer profile
  "seller.buyer.title": "Buyer profile",
  "seller.buyer.back": "← Back to buyers",
  "seller.buyer.memberSince": "Member since {date}",
  "seller.buyer.interests": "Interests",
  "seller.buyer.interestsDescription": "What this buyer is looking to acquire.",
  "seller.buyer.noProfile":
    "This buyer has not filled in a public profile yet.",
  "seller.buyer.jurisdictions": "Jurisdictions",
  "seller.buyer.licenseTypes": "License types",
  "seller.buyer.budget": "Budget",
  "seller.buyer.brief": "Brief",
  "seller.buyer.askedTitle": "Inquiries about your assets",
  "seller.buyer.askedNone": "This buyer has not inquired about your listings.",
  "seller.buyer.askedCount": "{count} inquiries",
  "seller.buyer.askedCount_one": "{count} inquiry",
  "seller.buyer.sentTitle": "Your messages to this buyer",
  "seller.buyer.sentDescription": "Seller → buyer inquiries you already sent.",
  "seller.buyer.sentEmpty": "Nothing sent yet.",
  "seller.buyer.sentBadge": "Sent",
  "seller.buyer.removedListing": "Removed listing",

  // Inquiries inbox
  "seller.inquiries.nav": "Inquiries",
  "seller.inquiries.meta": "Inbox",
  "seller.inquiries.title": "Inquiries inbox",
  "seller.inquiries.received": "{count} received",
  "seller.inquiries.unread": "{count} unread",
  "seller.inquiries.grouped": "grouped by listing",
  "seller.inquiries.empty.title": "Nothing in the inbox",
  "seller.inquiries.empty.description":
    "When a buyer contacts you about a listing, the request lands here.",
  "seller.inquiries.empty.action": "Review my listings",

  // Mark-as-read button
  "seller.markRead.button": "Mark {count} as read",
  "seller.markRead.pending": "Marking…",
  "seller.markRead.error.title": "Could not update",
  "seller.markRead.success.title": "Marked as read",
  "seller.markRead.success.description":
    "{count} inquiries moved out of your unread count.",
  "seller.markRead.success.description_one":
    "{count} inquiry moved out of your unread count.",

  // Asset row actions
  "seller.rowActions.edit": "Edit",
  "seller.rowActions.menuAria": "Actions for {title}",
  "seller.rowActions.menuLabel": "Listing actions",
  "seller.rowActions.next.DRAFT": "Publish",
  "seller.rowActions.next.PUBLISHED": "Unpublish",
  "seller.rowActions.next.PAUSED": "Resume",
  "seller.rowActions.next.REMOVED": "Restore as draft",
  "seller.rowActions.pause": "Pause",
  "seller.rowActions.deleteSoft": "Delete (soft)",
  "seller.rowActions.error.title": "Action failed",
  "seller.rowActions.toast.published": "Listing published",
  "seller.rowActions.toast.unpublished": "Listing unpublished",
  "seller.rowActions.toast.restored": "Listing restored as draft",
  "seller.rowActions.toast.paused": "Listing paused",
  "seller.rowActions.toast.removed": "Listing removed",

  // Asset form
  "seller.form.error.save": "Could not save the listing.",
  "seller.form.error.title": "Not saved",
  "seller.form.error.fallback": "Check the fields and try again.",
  "seller.form.toast.published": "Listing published",
  "seller.form.toast.publishedDescription":
    "It is now visible on the public marketplace.",
  "seller.form.toast.saved": "Listing saved",
  "seller.form.toast.savedDescription":
    "Saved as a draft — not visible publicly.",
  "seller.form.titleLabel": "Title",
  "seller.form.titlePlaceholder": "Nordic Pay EMI",
  "seller.form.licenseLabel": "License type",
  "seller.form.jurisdictionLabel": "Jurisdiction",
  "seller.form.priceLabel": "Price (optional)",
  "seller.form.pricePlaceholder": "Leave empty for price on request",
  "seller.form.currencyLabel": "Currency",
  "seller.form.counter": "{count} / min {min}",
  "seller.form.descriptionPlaceholder":
    "Licensed electronic money institution with 40k active accounts, full EEA passporting, profitable since 2021…",
  "seller.form.descriptionTooShort":
    "Describe the licence, traction and financials — at least {min} characters.",
  "seller.form.saving": "Saving…",
  "seller.form.savePublish": "Save & publish",
  "seller.form.publish": "Publish",
  "seller.form.saveAsDraft": "Save as draft",
  "seller.form.saveUnpublish": "Save & unpublish",
  "seller.form.publishedHint":
    "This listing is live on /assets — unpublishing removes it there.",
  "seller.form.draftHint": "Drafts stay private to you until you publish.",

  // Contact buyer dialog
  "seller.contact.error.title": "Message not sent",
  "seller.contact.listingFallback": "the listing",
  "seller.contact.sentTitle": "Message sent",
  "seller.contact.sentDescription":
    "{buyer} will see your note about “{asset}”.",
  "seller.contact.noAssets":
    "Publish a listing before contacting buyers — messages are always tied to one of your assets.",
  "seller.contact.allSent": "Message sent ✓",
  "seller.contact.open": "Contact buyer",
  "seller.contact.dialogTitle": "Contact {buyer}",
  "seller.contact.dialogDescription":
    "Buyer contact details stay private — the platform relays your message, attached to a listing.",
  "seller.contact.assetLabel": "About which asset?",
  "seller.contact.messageLabel": "Your message",
  "seller.contact.counter": "{count} / min {min}",
  "seller.contact.placeholder":
    "We can share the audited statements and the licence file under NDA — who should we talk to on your side?",
  "seller.contact.tooShort":
    "Add a bit more detail — at least {min} characters.",
  "seller.contact.sending": "Sending…",
  "seller.contact.send": "Send message",

  // Seller nav
  "seller.nav.aria": "Seller",
  "seller.nav.dashboard": "Dashboard",
  "seller.nav.public": "See public marketplace →",

  // Buyer filter bar
  "seller.filter.searchPlaceholder": "Company, name or description…",
  "seller.filter.budgetFrom": "Budget from (EUR)",
  "seller.filter.budgetTo": "Budget up to (EUR)",
  "seller.filter.apply": "Apply",
  "seller.filter.reset": "Reset",
  "seller.filter.jurisdiction": "Jurisdiction",
  "seller.filter.licenseType": "License type",
};
