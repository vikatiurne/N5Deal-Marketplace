# Task 03 — Authentication & role-based access

## Deliverables

1. Auth.js (NextAuth v5) with Credentials provider.
   - `authorize()` reads from `lib/db/repositories/users.ts`.
   - Verifies bcrypt hash.
   - Rejects SUSPENDED and DELETED users with clear error messages.
2. JWT session strategy. Token carries: `id`, `role`, `status`.
3. `lib/auth/` files: `auth.ts` (config), `guards.ts`, `types.ts`.
4. Guards:
   - `requireUser()` — server-side, throws redirect to /login
   - `requireRole(role)` — throws 403 / redirects
   - `getSession()` — safe nullable read
5. Routes:
   - `/login` — form, shows demo credentials (copy buttons)
   - `/register` — form with role picker (BUYER or SELLER only; not MANAGER)
   - `/logout` via server action
6. Middleware (`middleware.ts`):
   - protects `/buyer/*`, `/seller/*`, `/manager/*` by role
   - redirects unauthenticated to `/login?next=...`
   - redirects wrong role to their own home (`/buyer`, `/seller`, `/manager`)
7. Landing page `/` shows:
   - if logged out: hero + "Browse assets" + "Login" CTA
   - if logged in: redirect to role home
8. Session shape typed everywhere (`types/next-auth.d.ts`).

## Definition of Done

- Login as each demo user → lands on correct role home.
- Suspended seller login → clear error, no session created.
- Visiting `/manager` as buyer → redirected to `/buyer`.
- Session survives hard refresh (JWT cookie).
- `npm run lint` clean.

## Output format

- list of files
- manual test checklist with results (pass/fail)
