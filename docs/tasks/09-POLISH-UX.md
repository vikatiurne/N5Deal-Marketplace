# Task 09 — UX polish & visual consistency with N5Deal

## Deliverables

1. Visual pass across all pages:
   - consistent spacing scale (Tailwind: gap-4/6/8, p-6 cards)
   - consistent badge styles per licenseType (each type its own color)
   - consistent empty states (icon + headline + subtext + CTA)
   - consistent table styling (zebra optional, hover row)
2. Loading states:
   - `loading.tsx` for `/assets`, `/buyer`, `/seller`, `/manager`
   - skeletons matching real layout (not generic spinner)
3. Error handling:
   - global `error.tsx` with reset button
   - `not-found.tsx`
   - toast on every mutation success/failure
4. Accessibility pass:
   - all inputs have labels
   - buttons have aria-labels where icon-only
   - focus-visible rings
   - color contrast on accent (check with a tool, document result)
5. Responsive:
   - nav collapses to mobile menu on < md
   - tables become card list on < md (or horizontal scroll — pick one, document)
6. Micro-interactions:
   - hover states on cards
   - subtle transitions (150-200ms)
7. Screenshot each major page (assets, buyer, seller, manager) and attach
   in summary as links or describe layout.

## Definition of Done

- Every route renders without layout shift on refresh.
- Mobile (375px) usable on all 3 role dashboards.
- No console errors/warnings.
- `npm run lint` clean.

## Output format

- before/after notes per page
- list of any design tokens added (colors, radii, shadows)
