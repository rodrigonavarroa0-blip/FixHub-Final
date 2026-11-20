/* CONFIG - JAVASCRIPT */
/* Single place for every setting that changes between computers or deployments. */
/* The Supabase "anon"/"publishable" key is PUBLIC by design: Row Level Security in
   supabase/schema.sql is what protects the data, so it is safe to commit this file. */

export const CONFIG = {
    //Supabase project (Dashboard > Project Settings > API).
    supabaseUrl: "https://ghqjehsicmtlwdgarzbr.supabase.co",
    supabaseAnonKey: "sb_publishable_GyjW2TGfLlaQK50U9GUqwg_sErft7Yx",

    //Currency used to display catalog prices.
    currency: "USD",

    //AI assistant provider:
    //  "local" -> the browser talks to Ollama running on this computer (great for development and the defense demo).
    //  "edge"  -> the browser calls the Supabase Edge Function "ai-chat", which talks to Groq (works for every visitor).
    //  "auto"  -> "local" when the site is opened from localhost, "edge" when it is published.
    ai: {
        provider: "auto",
        localUrl: "http://localhost:11434",
        localModel: "llama3.2",
        edgeFunction: "ai-chat",
    },
};

//Returns true when the Supabase placeholders above were replaced with real values.
export function isSupabaseConfigured() {
    return !CONFIG.supabaseUrl.includes("YOUR-PROJECT-ID") && !CONFIG.supabaseAnonKey.startsWith("YOUR-");
}

//Resolves "auto" into the provider that should be used right now.
export function getAiProvider() {
    if (CONFIG.ai.provider !== "auto") {
        return CONFIG.ai.provider;
    }
    const host = window.location.hostname;
    return (host === "localhost" || host === "127.0.0.1") ? "local" : "edge";
}
