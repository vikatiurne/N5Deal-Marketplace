# Task 01 — Project scaffold

## Deliverables

1. Next.js 15 app (App Router, TypeScript strict, src/ dir).
2. Tailwind CSS installed and configured.
3. shadcn/ui initialized; add components: button, input, textarea, card,
   badge, select, dialog, dropdown-menu, table, toast, tabs, label, form.
4. Folder structure:
   src/
   app/ (routes)
   components/ (shared UI)
   components/ui/ (shadcn)
   lib/
   db/ (prisma client + repositories)
   auth/ (auth.js config)
   validation/ (zod schemas)
   utils.ts
   server/ (server actions)
   types/
5. Base dark theme in globals.css:
   - background: near-black (#0B0D10-ish)
   - surface: slightly lighter
   - accent: single strong color (pick one, document it)
   - typography: system font stack, tight headings
6. Root layout with:
   - top nav bar (logo "N5Deal" placeholder, role-aware links)
   - main content container (max-w-7xl, centered)
   - footer with "Test assignment build" note
7. ESLint + Prettier configured, `npm run lint` passes clean.
8. `.env.example` with placeholders (DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY).

## Do NOT do

- No DB models yet (that's task 02).
- No auth logic yet (task 03).
- No business pages yet.

## Definition of Done

- `npm run dev` starts, `/` renders the shell with nav + footer.
- `npm run lint` → 0 errors.
- Screenshot of the shell pasted in your summary as a markdown link or description.

## Output format

List every created file with a one-line purpose.
