/* ASSISTANT - JAVASCRIPT (no React here: plain functions used by the React components) */
/* The FixHub AI layer. It builds the "personality" of the assistant (system prompt with
   the brand tone + the real service catalog from the database) and sends the conversation
   to the AI: Ollama running locally, or Groq through the Supabase Edge Function.
   Every public function receives `lang` ("en" | "es") from the LanguageContext. */

import { CONFIG, getAiProvider } from "../config.js";
import { ApiError, invokeFunction, listServices } from "../services/supabase.js";

/* -------------------------------------------------------------- */
/* CATALOG CONTEXT                                                */
/* -------------------------------------------------------------- */

//The catalog is loaded once per visit and reused in every prompt.
let catalogPromise = null;

function loadCatalog() {
    if (!catalogPromise) {
        catalogPromise = listServices().catch(() => []);
    }
    return catalogPromise;
}

function catalogText(services, lang) {
    if (!services.length) {
        return "The catalog could not be loaded right now. If the visitor needs a technician, send them to the Services page.";
    }
    return services.map((service) => {
        const name = lang === "es" ? service.name_es : service.name_en;
        const description = lang === "es" ? service.description_es : service.description_en;
        return `- ${name} [${service.category}]: ${service.price} ${CONFIG.currency}, about ${service.duration_minutes} minutes. ${description}`;
    }).join("\n");
}

/* -------------------------------------------------------------- */
/* PROMPTS                                                        */
/* -------------------------------------------------------------- */

const LANGUAGE_NAMES = { en: "English", es: "Spanish" };

async function chatSystemPrompt(lang) {
    const services = await loadCatalog();
    return `You are FixBot, the virtual assistant of FixHub, a computer troubleshooting and repair business.

BRAND TONE: friendly, calm, clear and encouraging. Short sentences. Avoid heavy jargon and explain any technical word in simple terms. Use numbered steps for instructions. Speak as part of the FixHub team ("we", "our technicians").

LANGUAGE: answer in ${LANGUAGE_NAMES[lang]} unless the visitor clearly writes in another language.

WHAT YOU DO:
1. Help diagnose common computer problems (no power, slow performance, blue screens, overheating, Wi-Fi, viruses). If key information is missing, ask at most two short questions. Then give safe checks the visitor can try at home.
2. When the problem needs a technician, recommend the best FixHub service from the catalog below using its exact name, price and estimated time. Never invent services, prices or discounts.
3. Invite the visitor to request the service on the Contact page.

SAFETY: tell visitors to unplug the computer before touching hardware. Never tell them to open a power supply or a battery. If there is a burning smell, a swollen battery or liquid damage, tell them to stop using the device and contact a technician.

SCOPE: only help with computers and FixHub services. If asked about anything else, kindly redirect the conversation.

LENGTH: keep answers under 150 words unless you are giving a step-by-step guide.

FIXHUB CATALOG:
${catalogText(services, lang)}`;
}

/* -------------------------------------------------------------- */
/* PROVIDERS                                                      */
/* -------------------------------------------------------------- */

//Some models write their reasoning inside <think> tags; visitors should only see the answer.
function cleanAnswer(text) {
    return String(text || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function callLocalOllama(messages, format) {
    let response;
    try {
        response = await fetch(`${CONFIG.ai.localUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: CONFIG.ai.localModel,
                messages,
                stream: false,
                ...(format ? { format } : {}),
                options: { temperature: 0.4, num_predict: 700 },
            }),
        });
    } catch {
        throw new ApiError("Ollama is not reachable. Start it with `ollama serve` and allow this site in OLLAMA_ORIGINS.", 0, "ai_unreachable");
    }
    if (!response.ok) {
        throw new ApiError(`Ollama error (${response.status}). Check that the model "${CONFIG.ai.localModel}" is installed.`, response.status, "ai_error");
    }
    const data = await response.json();
    return data?.message?.content ?? "";
}

async function callEdgeFunction(messages, format) {
    const data = await invokeFunction(CONFIG.ai.edgeFunction, { messages, ...(format ? { format } : {}) });
    return data?.content ?? "";
}

//Sends messages to the configured provider and returns the answer text.
async function complete(messages, { format } = {}) {
    const raw = getAiProvider() === "local"
        ? await callLocalOllama(messages, format)
        : await callEdgeFunction(messages, format);
    const answer = cleanAnswer(raw);
    if (!answer) {
        throw new ApiError("The assistant returned an empty answer. Please try again.", 0, "ai_empty");
    }
    return answer;
}

/* -------------------------------------------------------------- */
/* PUBLIC FUNCTIONS                                               */
/* -------------------------------------------------------------- */

//Chat: `history` is [{ role: "user" | "assistant", content }]. Only the last turns are sent.
export async function askAssistant(history, lang) {
    const system = await chatSystemPrompt(lang);
    const recentTurns = history.slice(-10);
    return complete([{ role: "system", content: system }, ...recentTurns]);
}

//"Generates ready texts": turns the conversation into a repair request for the contact form.
//Only the visitor's own words are used as facts, so the model cannot turn FixBot's
//questions into invented statements. The recommended service is detected in code by
//looking for catalog names inside FixBot's answers.
export async function draftContactMessage(history, lang) {
    const services = await loadCatalog();

    const visitorFacts = history
        .filter((turn) => turn.role === "user")
        .slice(-6)
        .map((turn) => `- ${turn.content}`)
        .join("\n");

    const botText = history.filter((turn) => turn.role === "assistant").map((turn) => turn.content.toLowerCase()).join("\n");
    const recommended = services
        .map((service) => (lang === "es" ? service.name_es : service.name_en))
        .filter((name) => botText.includes(name.toLowerCase()));

    const system = `You write repair requests for FixHub customers: the message the customer will send through the contact form.
Rules: write in ${LANGUAGE_NAMES[lang]}, first person, 2 to 4 sentences, polite.
Use ONLY the facts listed by the user. Do not add symptoms, devices, causes, or anything the customer did or did not do. If there are few facts, write a short message.
End by asking FixHub for help${recommended.length ? ` with the service "${recommended[0]}"` : " with a diagnosis"}.
No greeting placeholders, no signature, no extra commentary: output ONLY the message text.`;

    return complete([
        { role: "system", content: system },
        { role: "user", content: visitorFacts ? `Facts written by the customer:\n${visitorFacts}` : "The customer has not described the problem yet." },
    ]);
}

//Admin helper: writes English and Spanish catalog descriptions in the brand tone.
export async function generateServiceDescriptions({ name, category, price, durationMinutes }) {
    const system = `You write catalog descriptions for FixHub, a friendly computer repair business.
Return ONLY a JSON object with two string fields: "description_en" (English) and "description_es" (Spanish).
Each description: 1 or 2 sentences, between 80 and 300 characters, clear benefits for a non-technical customer, friendly tone, no prices, no emojis.`;
    const user = `Service: ${name}\nCategory: ${category}\nPrice: ${price} ${CONFIG.currency}\nEstimated time: ${durationMinutes} minutes`;

    const answer = await complete([
        { role: "system", content: system },
        { role: "user", content: user },
    ], { format: "json" });

    let parsed;
    try {
        //Some models wrap JSON in extra text; keep only the {...} part.
        parsed = JSON.parse(answer.slice(answer.indexOf("{"), answer.lastIndexOf("}") + 1));
    } catch {
        throw new ApiError("The AI answer was not valid JSON. Please try again.", 0, "ai_bad_json");
    }
    if (typeof parsed.description_en !== "string" || typeof parsed.description_es !== "string") {
        throw new ApiError("The AI answer was incomplete. Please try again.", 0, "ai_bad_json");
    }
    return {
        description_en: parsed.description_en.trim().slice(0, 400),
        description_es: parsed.description_es.trim().slice(0, 400),
    };
}
