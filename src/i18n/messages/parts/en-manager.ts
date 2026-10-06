/** manager zone strings (en): nav, overview, members, listings, audit, moderation. */
export const manager = {
  // Navigation
  "manager.nav.overview": "Overview",
  "manager.nav.users": "Members",
  "manager.nav.assets": "Listings",
  "manager.nav.audit": "Audit log",
  "manager.nav.seeMarketplace": "See public marketplace →",

  // Zone metadata
  "manager.home.meta.title": "Manager overview",
  "manager.users.meta.title": "Members · Manager",
  "manager.assets.meta.title": "Listings · Manager",
  "manager.audit.meta.title": "Audit log · Manager",

  // Loading skeleton
  "manager.loading.overview": "Loading platform overview",

  // Shared moderation controls
  "manager.moderate": "Moderate",
  "manager.moderation": "Moderation",
  "manager.filters.apply": "Apply",
  "manager.filters.reset": "Reset",
  "manager.filters.resetAll": "Reset filters",
  "manager.filters.allStatuses": "All statuses",
  "manager.toast.failed": "Action failed",

  // Moderation outcome names — reused as toast titles and audit entries
  "manager.action.userSuspended": "Member suspended",
  "manager.action.userReactivated": "Member reactivated",
  "manager.action.userSoftDeleted": "Member soft-deleted",
  "manager.action.assetPublished": "Listing published",
  "manager.action.assetPaused": "Listing paused",
  "manager.action.assetRemoved": "Listing removed",

  // Overview
  "manager.home.title": "Platform overview",
  "manager.home.subtitle":
    "Moderating {email} · every action below is written to the audit log.",
  "manager.home.membersCard": "Members",
  "manager.home.listingsCard": "Listings",
  "manager.home.inquiriesCard": "Inquiries",
  "manager.home.attentionCard": "Needs attention",
  "manager.home.membersCardNote":
    "{sellers} active sellers · {buyers} active buyers",
  "manager.home.listingsCardNote":
    "{published} live · {draft} draft · {paused} paused · {removed} removed",
  "manager.home.inquiriesCardNote":
    "{fromBuyers} buyer → seller · {fromSellers} seller → buyer",
  "manager.home.attentionCardNote": "suspended or soft-deleted members",
  "manager.home.matrixTitle": "Members by role and status",
  "manager.home.matrixDescription":
    "Click a number to open the filtered moderation table.",
  "manager.home.manageMembers": "Manage members",
  "manager.home.total": "Total",
  "manager.home.assetMatrixTitle": "Listings by status",
  "manager.home.assetMatrixDescription":
    "Removing a listing hides it from the marketplace but keeps it visible here.",
  "manager.home.manageListings": "Manage listings",
  "manager.home.recentMembersTitle": "Recent signups",
  "manager.home.recentMembersDescription": "Latest {limit} accounts.",
  "manager.home.recentListingsTitle": "Recent listings",
  "manager.home.recentListingsDescription": "Latest {limit} assets.",
  "manager.home.inquiriesFooter":
    "Inquiries total {total} · {unread} still unread by sellers.",

  // Members
  "manager.users.title": "Members",
  "manager.users.subtitle":
    "{count} accounts · suspend or soft-delete non-compliant members. Every action is audited.",
  "manager.users.subtitle_one":
    "{count} account · suspend or soft-delete non-compliant members. Every action is audited.",
  "manager.users.emptyTitle": "No members match these filters",
  "manager.users.emptyDescription":
    "Clear the search text or widen the role and status filters.",
  "manager.users.caption":
    "All platform users — actions are recorded in the audit log.",
  "manager.users.company": "Company",
  "manager.users.joined": "Joined",

  // Listings
  "manager.assets.title": "Listings",
  "manager.assets.subtitle":
    "{count} assets across all sellers · removing a listing hides it from the marketplace without deleting it.",
  "manager.assets.subtitle_one":
    "{count} asset across all sellers · removing a listing hides it from the marketplace without deleting it.",
  "manager.assets.emptyTitle": "No listings match these filters",
  "manager.assets.emptyDescription":
    "Clear the search text or widen the license, jurisdiction and status filters.",
  "manager.assets.caption":
    "Every listing, including drafts and unpublished assets.",
  "manager.assets.titleColumn": "Title",
  "manager.assets.seller": "Seller",
  "manager.assets.license": "License",
  "manager.assets.jurisdiction": "Jurisdiction",
  "manager.assets.listed": "Listed",

  // Audit log
  "manager.audit.title": "Audit log",
  "manager.audit.subtitle":
    "{count} recorded actions · entries are append-only and never edited or removed.",
  "manager.audit.subtitle_one":
    "{count} recorded action · entries are append-only and never edited or removed.",
  "manager.audit.actionLabel": "Action",
  "manager.audit.allActions": "All actions",
  "manager.audit.targetLabel": "Target",
  "manager.audit.allTargets": "All targets",
  "manager.audit.targetUser": "Member",
  "manager.audit.targetAsset": "Listing",
  "manager.audit.memberActions": "Member actions",
  "manager.audit.listingActions": "Listing actions",
  "manager.audit.emptyTitle": "No audit entries yet",
  "manager.audit.emptyDescription":
    "Moderate a member or a listing and it will show up here immediately.",
  "manager.audit.byActor": "by {email}",
  "manager.audit.totalsNav": "Action totals",

  // Member row actions
  "manager.userActions.aria": "Actions for {email}",
  "manager.userActions.reactivate": "Reactivate",
  "manager.userActions.suspend": "Suspend",
  "manager.userActions.softDelete": "Soft-delete",
  "manager.userActions.locked": "Locked",
  "manager.userActions.lockedHint":
    "Manager accounts cannot be suspended or deleted",
  "manager.userActions.suspendTitle": "Suspend {email}?",
  "manager.userActions.suspendDescription":
    "They will be signed out immediately and cannot sign in again until a manager reactivates the account. Their listings and inquiries are kept.",
  "manager.userActions.suspendConfirm": "Suspend member",
  "manager.userActions.deleteTitle": "Soft-delete {email}?",
  "manager.userActions.deleteDescription":
    "The account can no longer sign in and drops out of the buyer directory and matching. Nothing is deleted: listings and inquiries stay in the database and can be restored.",
  "manager.userActions.deleteConfirm": "Soft-delete member",
  "manager.userActions.reactivateTitle": "Reactivate {email}?",
  "manager.userActions.reactivateDescription":
    "The account gets full access again, including the buyer directory.",
  "manager.userActions.reactivateConfirm": "Reactivate member",

  // Listing row actions
  "manager.assetActions.view": "View",
  "manager.assetActions.aria": "Moderate {title}",
  "manager.assetActions.publish": "Publish",
  "manager.assetActions.reinstatePublish": "Reinstate & publish",
  "manager.assetActions.pause": "Pause",
  "manager.assetActions.removeSoft": "Remove (soft)",
  "manager.assetActions.removeTitle": "Remove “{title}”?",
  "manager.assetActions.removeDescription":
    "The listing disappears from the public marketplace but stays in this table and in the seller's account. It can be reinstated later.",
  "manager.assetActions.removeConfirm": "Remove listing",
  "manager.assetActions.pauseTitle": "Pause “{title}”?",
  "manager.assetActions.pauseDescription":
    "The listing is unpublished while paused. The seller can resume it themselves at any time.",
  "manager.assetActions.pauseConfirm": "Pause listing",

  // Filters
  "manager.userFilter.placeholder": "Email, company or name…",
  "manager.userFilter.allRoles": "All roles",
  "manager.assetFilter.placeholder": "Title or description…",
  "manager.assetFilter.licenseType": "License type",
  "manager.assetFilter.jurisdiction": "Jurisdiction",
};
