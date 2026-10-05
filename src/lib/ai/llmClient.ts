/** Raw completion provider seam — implemented here, mocked in the parser tests. */
export type LlmClient = (input: {
  system: string;
  user: string;
}) => Promise<string>;

/**
 * OpenAI Chat Completions via plain `fetch`.
 *
 * Why OpenAI and not Anthropic: the app already targets a Node/Next runtime and
 * this is the JSON-shaped extraction task OpenAI's `json_object` response mode
 * is built for; `response_format` removes most of the "please return only JSON"
 * prompt surface. Anthropic would need the same Zod guard plus a manual tool
 * call round-trip for no benefit here.
 *
 * Why `fetch` and not the `openai` SDK: the SDK would be the only new runtime
 * dependency in the project, while the REST call is ~30 lines and keeps the
 * `LlmClient` seam trivial to mock in tests.
 *
 * `OPENAI_BASE_URL` makes the endpoint swappable (Azure-compatible gateways,
 * a local mock in E2E checks); the API surface used is the standard
 * `/chat/completions`.
 */

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const TIMEOUT_MS = 15_000;

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
}

/**
 * Returns a client, or `null` when no API key is configured — the caller then
 * falls back to keyword search instead of failing the request.
 */
export function createLlmClient(): LlmClient | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = (
    process.env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  return async ({ system, user }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            // Only the user's own words leave the server — no user records,
            // emails or other PII are ever sent to the model.
            { role: "user", content: user },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM responded ${response.status}`);
      }

      const payload = (await response.json()) as ChatCompletionResponse;
      if (payload.error?.message) {
        throw new Error(payload.error.message);
      }

      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned an empty completion");
      return content;
    } finally {
      clearTimeout(timer);
    }
  };
}
