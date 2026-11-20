// =============================================================================
// FIXHUB - AI CHAT EDGE FUNCTION (Supabase / Deno)
//
// Why this exists: GitHub Pages only serves static files, so the browser cannot
// keep a secret API key. The website sends the conversation here, and this
// function forwards it to an AI provider using the secret key stored in Supabase.
//
// It speaks the "OpenAI-compatible" chat format (POST {base}/chat/completions),
// which Groq, Google Gemini and Ollama Cloud all accept. Changing provider only
// means changing the secrets below, not the code. Default: Groq (free plan).
//
// Secrets (Dashboard > Edge Functions > Secrets, or `supabase secrets set`):
//   AI_API_KEY      -> key from https://console.groq.com/keys
//   AI_BASE_URL     -> optional, defaults to https://api.groq.com/openai/v1
//   AI_MODEL        -> optional, defaults to openai/gpt-oss-20b
//   AI_REASONING    -> optional reasoning effort for reasoning models (low|medium|high),
//                      defaults to low; set it to "none" for models that do not reason
//   ALLOWED_ORIGIN  -> optional, e.g. https://your-user.github.io (defaults to *)
//
// Deploy: supabase functions deploy ai-chat --no-verify-jwt
// =============================================================================

const AI_BASE_URL = Deno.env.get("AI_BASE_URL") ?? "https://api.groq.com/openai/v1";
const AI_API_KEY = Deno.env.get("AI_API_KEY") ?? "";
const AI_MODEL = Deno.env.get("AI_MODEL") ?? "openai/gpt-oss-20b";
const AI_REASONING = Deno.env.get("AI_REASONING") ?? "low";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

// Guardrails so the endpoint cannot be used as a free, unlimited LLM.
const MAX_MESSAGES = 16;
const MAX_CHARS_PER_MESSAGE = 6000;
const ALLOWED_ROLES = new Set(["system", "user", "assistant"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatMessage = { role: string; content: string };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Returns an error text, or null when the payload is valid.
function validate(messages: unknown): string | null {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > MAX_MESSAGES) return `too many messages (max ${MAX_MESSAGES})`;
  for (const m of messages as ChatMessage[]) {
    if (!m || typeof m.content !== "string" || !ALLOWED_ROLES.has(m.role)) return "invalid message format";
    if (m.content.length > MAX_CHARS_PER_MESSAGE) return "message too long";
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { messages?: unknown; format?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const problem = validate(body.messages);
  if (problem) return json({ error: problem }, 400);

  try {
    const aiResponse = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: body.messages,
        temperature: 0.4,
        max_tokens: 1200,
        // gpt-oss "thinks" before answering; low effort keeps answers fast and short.
        ...(AI_REASONING !== "none" ? { reasoning_effort: AI_REASONING } : {}),
        // Only JSON mode is passed through (used by the admin text generator).
        ...(body.format === "json" ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI provider error", aiResponse.status, await aiResponse.text());
      return json({ error: "The AI service is not available right now." }, 502);
    }

    // OpenAI-compatible answer: { choices: [ { message: { content } } ] }
    const data = await aiResponse.json();
    return json({ content: data?.choices?.[0]?.message?.content ?? "" });
  } catch (error) {
    console.error("AI request failed", error);
    return json({ error: "The AI service is not available right now." }, 502);
  }
});
