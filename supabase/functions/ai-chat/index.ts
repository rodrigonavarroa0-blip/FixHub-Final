// =============================================================================
// FIXHUB - AI CHAT EDGE FUNCTION (Supabase / Deno)
//
// Why this exists: GitHub Pages only serves static files, so the browser cannot
// keep a secret API key. The website sends the conversation here, and this
// function forwards it to Ollama (Ollama Cloud or any Ollama server reachable
// from the internet) using the secret key stored in Supabase.
//
// Secrets (Dashboard > Edge Functions > Secrets, or `supabase secrets set`):
//   OLLAMA_API_KEY  -> key from https://ollama.com/settings/keys (Ollama Cloud)
//   OLLAMA_HOST     -> optional, defaults to https://ollama.com
//   OLLAMA_MODEL    -> optional, defaults to gpt-oss:20b
//   ALLOWED_ORIGIN  -> optional, e.g. https://your-user.github.io (defaults to *)
//
// Deploy: supabase functions deploy ai-chat --no-verify-jwt
// =============================================================================

const OLLAMA_HOST = Deno.env.get("OLLAMA_HOST") ?? "https://ollama.com";
const OLLAMA_API_KEY = Deno.env.get("OLLAMA_API_KEY") ?? "";
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") ?? "gpt-oss:20b";
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
    const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: body.messages,
        stream: false,
        // Only JSON mode is passed through (used by the admin text generator).
        ...(body.format === "json" ? { format: "json" } : {}),
        options: { temperature: 0.4, num_predict: 700 },
      }),
    });

    if (!ollamaResponse.ok) {
      console.error("Ollama error", ollamaResponse.status, await ollamaResponse.text());
      return json({ error: "The AI service is not available right now." }, 502);
    }

    const data = await ollamaResponse.json();
    return json({ content: data?.message?.content ?? "" });
  } catch (error) {
    console.error("Ollama request failed", error);
    return json({ error: "The AI service is not available right now." }, 502);
  }
});
