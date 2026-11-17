/* CHAT WIDGET - JAVASCRIPT */
/* Floating "FixBot" assistant available on every page. The conversation is kept in
   sessionStorage so it continues when the visitor moves to another page. */

import { askAssistant, draftContactMessage } from "../ai/assistant.js";
import { t, onLanguageChange, translateElements } from "../core/i18n.js";
import { escapeHtml, errorMessage } from "../core/ui.js";

const HISTORY_KEY = "fixhub_chat_history";
export const DRAFT_KEY = "fixhub_contact_draft";
const MAX_INPUT = 800;

let history = loadHistory();
let isBusy = false;
let elements = {};

function loadHistory() {
    try {
        return JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

function saveHistory() {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30)));
}

//Very small formatter: escapes HTML first, then supports **bold** and line breaks.
function formatAnswer(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

function template() {
    return `
    <button type="button" class="chat-toggle" aria-expanded="false" aria-controls="chat-panel">
        <span class="chat-toggle-icon" aria-hidden="true">💬</span>
        <span data-i18n-block="chatToggle">Ask FixBot</span>
    </button>
    <section id="chat-panel" class="chat-panel" hidden aria-labelledby="chat-title">
        <header class="chat-header">
            <div>
                <h2 id="chat-title" data-i18n-block="chatTitle">FixBot</h2>
                <p data-i18n-block="chatSubtitle">FixHub AI assistant</p>
            </div>
            <div class="chat-header-actions">
                <button type="button" class="chat-icon-btn chat-reset" data-i18n-aria-label="chatReset" aria-label="New conversation">↺</button>
                <button type="button" class="chat-icon-btn chat-close" data-i18n-aria-label="chatClose" aria-label="Close">✕</button>
            </div>
        </header>
        <div class="chat-messages" aria-live="polite"></div>
        <div class="chat-chips">
            <button type="button" class="chip" data-prompt-key="chatChipSlowPrompt" data-i18n-block="chatChipSlow">My PC is slow</button>
            <button type="button" class="chip" data-prompt-key="chatChipServicePrompt" data-i18n-block="chatChipService">Which service do I need?</button>
            <button type="button" class="chip chip-draft" data-action="draft" data-i18n-block="chatChipDraft">Write my repair request</button>
        </div>
        <form class="chat-form">
            <label for="chat-input" class="visually-hidden" data-i18n-block="chatInputLabel">Message</label>
            <input id="chat-input" type="text" maxlength="${MAX_INPUT}" autocomplete="off" data-i18n-placeholder="chatPlaceholder" placeholder="Describe your problem...">
            <button type="submit" class="chat-send" data-i18n-aria-label="chatSend" aria-label="Send">➤</button>
        </form>
        <p class="chat-disclaimer" data-i18n-block="chatDisclaimer">AI answers can be wrong. For serious issues, ask a technician.</p>
    </section>`;
}

/* -------------------------------------------------------------- */
/* RENDERING                                                      */
/* -------------------------------------------------------------- */

function bubble(message) {
    const roleClass = message.role === "user" ? "chat-bubble-user" : "chat-bubble-bot";
    const body = message.role === "user" ? escapeHtml(message.content) : formatAnswer(message.content);
    const draftActions = message.kind === "draft"
        ? `<div class="chat-draft-actions"><button type="button" class="button button-primary chat-use-draft">${escapeHtml(t("chatUseDraft", "Use in contact form"))}</button></div>`
        : "";
    const label = message.kind === "draft" ? `<p class="chat-draft-label">${escapeHtml(t("chatDraftLabel", "Ready-to-send message"))}</p>` : "";
    return `<div class="chat-bubble ${roleClass}${message.kind === "draft" ? " chat-bubble-draft" : ""}">${label}${body}${draftActions}</div>`;
}

function render({ error } = {}) {
    const welcome = bubble({ role: "assistant", content: t("chatWelcome", "Hi! I'm FixBot. Tell me what's wrong with your computer and I'll help you find a solution.") });
    const typing = isBusy
        ? `<div class="chat-bubble chat-bubble-bot chat-typing" aria-label="${escapeHtml(t("chatTyping", "FixBot is typing"))}"><span></span><span></span><span></span></div>`
        : "";
    const errorBox = error
        ? `<div class="chat-error" role="alert">${escapeHtml(error)} <button type="button" class="chat-retry">${escapeHtml(t("retry", "Try again"))}</button></div>`
        : "";

    elements.messages.innerHTML = welcome + history.map(bubble).join("") + typing + errorBox;
    elements.messages.scrollTop = elements.messages.scrollHeight;

    elements.messages.querySelectorAll(".chat-use-draft").forEach((button, index) => {
        const drafts = history.filter((message) => message.kind === "draft");
        button.addEventListener("click", () => useDraft(drafts[index].content));
    });
    elements.messages.querySelector(".chat-retry")?.addEventListener("click", retryLast);

    elements.input.disabled = isBusy;
    elements.send.disabled = isBusy;
    elements.chips.forEach((chip) => { chip.disabled = isBusy; });
}

/* -------------------------------------------------------------- */
/* ACTIONS                                                        */
/* -------------------------------------------------------------- */

let lastAction = null;

async function run(action) {
    lastAction = action;
    isBusy = true;
    render();
    try {
        await action();
        isBusy = false;
        saveHistory();
        render();
    } catch (error) {
        isBusy = false;
        render({ error: errorMessage(error) });
    }
}

function retryLast() {
    if (lastAction) {
        run(lastAction);
    }
}

//Only normal chat turns are sent as context (drafts are not part of the dialogue).
function chatTurns() {
    return history.filter((message) => !message.kind).map(({ role, content }) => ({ role, content }));
}

function sendMessage(text) {
    const content = text.trim().slice(0, MAX_INPUT);
    if (!content || isBusy) {
        return;
    }
    history.push({ role: "user", content });
    saveHistory();
    run(async () => {
        const answer = await askAssistant(chatTurns());
        history.push({ role: "assistant", content: answer });
    });
}

function requestDraft() {
    if (isBusy) {
        return;
    }
    run(async () => {
        const draft = await draftContactMessage(chatTurns());
        history.push({ role: "assistant", content: draft, kind: "draft" });
    });
}

//Saves the generated text and opens the contact form, which pre-fills it.
function useDraft(text) {
    sessionStorage.setItem(DRAFT_KEY, text);
    window.location.href = "contact.html#contact-form";
}

function setOpen(open) {
    elements.panel.hidden = !open;
    elements.toggle.setAttribute("aria-expanded", String(open));
    elements.root.classList.toggle("is-open", open);
    if (open) {
        render();
        elements.input.focus();
    }
}

export function mountChatWidget() {
    const root = document.createElement("div");
    root.className = "chat-widget";
    root.innerHTML = template();
    document.body.appendChild(root);

    elements = {
        root,
        toggle: root.querySelector(".chat-toggle"),
        panel: root.querySelector(".chat-panel"),
        messages: root.querySelector(".chat-messages"),
        form: root.querySelector(".chat-form"),
        input: root.querySelector("#chat-input"),
        send: root.querySelector(".chat-send"),
        chips: root.querySelectorAll(".chip"),
    };

    translateElements(root);

    elements.toggle.addEventListener("click", () => setOpen(elements.panel.hidden));
    root.querySelector(".chat-close").addEventListener("click", () => {
        setOpen(false);
        elements.toggle.focus();
    });
    root.querySelector(".chat-reset").addEventListener("click", () => {
        if (isBusy) return;
        history = [];
        saveHistory();
        render();
    });
    elements.form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage(elements.input.value);
        elements.input.value = "";
    });
    elements.chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            if (chip.dataset.action === "draft") {
                requestDraft();
            } else {
                sendMessage(t(chip.dataset.promptKey, chip.textContent));
            }
        });
    });
    //Escape closes the panel (keyboard accessibility).
    root.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !elements.panel.hidden) {
            setOpen(false);
            elements.toggle.focus();
        }
    });

    //Any element with data-open-chat (e.g. the AI banner on Home) opens the assistant.
    document.querySelectorAll("[data-open-chat]").forEach((button) => {
        button.addEventListener("click", () => setOpen(true));
    });

    onLanguageChange(() => {
        if (!elements.panel.hidden) render();
    });
}
