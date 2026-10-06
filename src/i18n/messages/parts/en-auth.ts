/** Auth zone: sign-in and registration pages, forms, demo credentials. */
export const auth = {
  // Login page
  "auth.login.subtitle":
    "Access your N5Deal workspace. Use a seeded demo account below.",
  "auth.login.registeredNotice": "Account created. You can sign in now.",
  "auth.login.submitPending": "Signing in…",
  "auth.login.toast.failedTitle": "Could not sign in",

  // Sign-in errors (codes stay untranslated — these are the display texts)
  "auth.error.accountSuspended":
    "This account is suspended. Contact the platform manager.",
  "auth.error.accountDeleted": "This account has been deleted.",
  "auth.error.invalidCredentials": "Invalid email or password.",
  "auth.error.signInFailed": "Sign-in failed.",
  "auth.error.signInFailedRetry": "Sign-in failed. Try again.",
  "auth.error.configuration": "Sign-in is misconfigured. Try again later.",
  "auth.error.accessDenied": "You do not have access to this account.",

  // Shared form fields
  "auth.field.password": "Password",
  "auth.field.displayName": "Display name",

  // Password visibility toggle
  "auth.password.show": "Show password",
  "auth.password.hide": "Hide password",

  // Register page
  "auth.register.title": "Create your account",
  "auth.register.subtitle":
    "Register as a buyer or seller. Platform manager accounts are issued by the platform team only.",
  "auth.register.roleBuyerHint": "I'm looking to acquire fintech assets",
  "auth.register.roleSellerHint": "I want to list assets for sale",
  "auth.register.roleLegend": "I am a",
  "auth.register.passwordPlaceholder": "At least 8 characters",
  "auth.register.submitPending": "Creating account…",
  "auth.register.toast.failedTitle": "Could not create the account",
  "auth.register.emailTaken": "Email already registered",

  // Demo credentials panel
  "auth.demo.title": "Demo credentials",
  "auth.demo.description": "One password for all seeded accounts:",
  "auth.demo.emailAria": "{email} email",
  "auth.demo.passwordAria": "{email} password",
  "auth.demo.copyAria": "Copy {label}",
  "auth.demo.blockedTitle": "Sign-in is blocked for this account",
};
