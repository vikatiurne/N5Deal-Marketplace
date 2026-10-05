# Task 07 — Platform manager flow

## Deliverables

1. `/manager` — overview dashboard:
   - counts: users by role & status, assets by status, inquiries total
   - recent signups (last 5)
   - recent assets (last 5)
2. `/manager/users`:
   - table with role, status, email, company, createdAt
   - filters: role, status, free-text (email/company)
   - actions per row: Suspend, Reactivate, Soft-delete
   - confirmation dialog (destructive actions)
   - cannot suspend/delete MANAGER role (guard)
3. `/manager/assets`:
   - table with seller, title, license, jurisdiction, price, status
   - filters: status, licenseType, jurisdiction, free-text
   - actions: Pause, Publish, Remove (soft)
4. Every mutation:
   - server action with `requireRole('MANAGER')`
   - writes an entry to `AuditLog` model:
     `{ id, actorId, action, targetType, targetId, createdAt, meta }`
     (add this model to schema — new migration)
5. `/manager/audit` — list of audit log entries (paginated, filterable by action).

## Definition of Done

- Suspending a seller → that seller can't log in (verify).
- Suspending a buyer → their inquiries remain but profile marked inactive.
- Removing an asset → disappears from public list but visible in manager view.
- Every action appears in `/manager/audit`.
- Attempting to suspend another MANAGER → blocked with clear error.

## Output format

- files
- new migration name
- manual test checklist
