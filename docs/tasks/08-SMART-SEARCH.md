# Task 08 — AI-powered smart search

## Deliverables

1. On `/assets`, add a natural-language search bar above the filters:
   - placeholder: "e.g. EMI license in Lithuania under €500k"
   - user submits → `/api/smart-search` (POST)
2. `app/api/smart-search/route.ts`:
   - input: `{ query: string }` (Zod, max 300 chars)
   - calls LLM (OpenAI or Anthropic — pick one, document why)
   - system prompt asks for STRICT JSON matching schema:
     {
     licenseType?: "EMI"|"PI"|"MICA_CASP"|"VASP"|"BANK"|"OTHER",
     jurisdiction?: string, // ISO-2
     priceMin?: number,
     priceMax?: number,
     keywords?: string[] // for title/description matching
     }
   - validates LLM output with Zod; if invalid, fall back to `{keywords:[query]}`
   - returns `{ filters, explanation }` where explanation is a human sentence
     ("Looking for EMI licenses in Lithuania under €500k")
3. Client behavior:
   - on success, redirect to `/assets?<filters>&ai=1`
   - show a dismissible banner: "AI interpreted your query as: <explanation>"
   - if LLM fails, fall back to plain `q=` keyword search, show toast
4. Rate limiting: max 10 requests / minute / session (in-memory Map is fine).
5. Env var `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) in `.env.example`.
6. `lib/ai/smartSearch.ts`:
   - `parseQuery(q: string): Promise<SmartFilters>`
   - pure function around the LLM call, easy to unit-test with a mock.
7. Unit test: `parseQuery` with a mocked client returns expected filters
   for 3 canned inputs.

## Rules

- Never trust raw LLM output — always Zod-parse.
- Never send PII to the LLM — only the user query string.
- Log (dev only) the raw LLM response for debugging.

## Definition of Done

- Typing "EMI in Lithuania under 500k" → redirected URL contains
  `licenseType=EMI&jurisdiction=LT&priceMax=500000`.
- Banner shows interpretation.
- Malformed LLM response → graceful fallback, no crash.
- Unit test passes.

## Output format

- files
- sample queries with observed parsed filters
- chosen provider + one-line justification
