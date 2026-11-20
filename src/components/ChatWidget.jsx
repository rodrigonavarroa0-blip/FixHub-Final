/* CHAT WIDGET - COMPONENT */
/* Floating "FixBot" assistant available on every page. The conversation is saved in
   sessionStorage, so it continues if the visitor reloads the page. The AI logic itself
   lives in src/ai/assistant.js; this component only handles the interface. */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { askAssistant, draftContactMessage } from "../ai/assistant.js";
import { useChat } from "../context/ChatContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { errorMessage } from "../utils/format.js";

const HISTORY_KEY = "fixhub_chat_history";
const MAX_INPUT = 800;

function loadHistory() {
    try {
        return JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

//Very small formatter for the AI answers: supports **bold** and line breaks.
//It builds React elements (never raw HTML), so the AI cannot inject code into the page.
function FormattedText({ text }) {
    return text.split("\n").map((line, lineIndex) => (
        <span key={lineIndex}>
            {lineIndex > 0 && <br />}
            {line.split(/\*\*(.+?)\*\*/g).map((part, partIndex) => (
                //split() with a capture group puts the bold parts at the odd positions.
                partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
            ))}
        </span>
    ));
}

function Bubble({ message, onUseDraft, t }) {
    const isUser = message.role === "user";
    const isDraft = message.kind === "draft";
    const className = `chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-bot"}${isDraft ? " chat-bubble-draft" : ""}`;
    return (
        <div className={className}>
            {isDraft && <p className="chat-draft-label">{t("chatDraftLabel", "Ready-to-send message")}</p>}
            {isUser ? message.content : <FormattedText text={message.content} />}
            {isDraft && (
                <div className="chat-draft-actions">
                    <button type="button" className="button button-primary chat-use-draft" onClick={() => onUseDraft(message.content)}>
                        {t("chatUseDraft", "Use in contact form")}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ChatWidget() {
    const { lang, t } = useLanguage();
    const { isOpen, setIsOpen, setDraft } = useChat();
    const navigate = useNavigate();

    const [history, setHistory] = useState(loadHistory);
    const [input, setInput] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState("");
    const lastAction = useRef(null);

    const messagesRef = useRef(null);
    const inputRef = useRef(null);
    const toggleRef = useRef(null);

    //Save the last 30 messages every time the history changes.
    useEffect(() => {
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30)));
    }, [history]);

    //Keep the newest message visible.
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [history, isBusy, error, isOpen]);

    //Focus the text box when the panel opens.
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    function close() {
        setIsOpen(false);
        toggleRef.current?.focus();
    }

    //Runs an AI request with the loading ("typing") and error states. `action` returns the new message.
    async function run(action, baseHistory) {
        lastAction.current = { action, baseHistory };
        setIsBusy(true);
        setError("");
        try {
            const reply = await action(baseHistory);
            setHistory([...baseHistory, reply]);
        } catch (requestError) {
            setError(errorMessage(requestError, t));
        } finally {
            setIsBusy(false);
        }
    }

    function retryLast() {
        if (lastAction.current) {
            run(lastAction.current.action, lastAction.current.baseHistory);
        }
    }

    //Only normal chat turns are sent as context (drafts are not part of the dialogue).
    function chatTurns(messages) {
        return messages.filter((message) => !message.kind).map(({ role, content }) => ({ role, content }));
    }

    function sendMessage(text) {
        const content = text.trim().slice(0, MAX_INPUT);
        if (!content || isBusy) {
            return;
        }
        const withQuestion = [...history, { role: "user", content }];
        setHistory(withQuestion);
        run(async (base) => ({ role: "assistant", content: await askAssistant(chatTurns(base), lang) }), withQuestion);
    }

    function requestDraft() {
        if (isBusy) {
            return;
        }
        run(async (base) => ({ role: "assistant", kind: "draft", content: await draftContactMessage(chatTurns(base), lang) }), history);
    }

    //Sends the generated text to the Contact form (through ChatContext) and opens that page.
    function sendDraftToContact(text) {
        setDraft(text);
        setIsOpen(false);
        navigate("/contact");
    }

    function handleSubmit(event) {
        event.preventDefault();
        sendMessage(input);
        setInput("");
    }

    function resetConversation() {
        if (!isBusy) {
            setHistory([]);
            setError("");
        }
    }

    return (
        <div
            className={`chat-widget${isOpen ? " is-open" : ""}`}
            onKeyDown={(event) => {
                //Escape closes the panel (keyboard accessibility).
                if (event.key === "Escape" && isOpen) close();
            }}
        >
            <button
                ref={toggleRef}
                type="button"
                className="chat-toggle"
                aria-expanded={isOpen}
                aria-controls="chat-panel"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="chat-toggle-icon" aria-hidden="true">💬</span>
                <span>{t("chatToggle", "Ask FixBot")}</span>
            </button>

            <section id="chat-panel" className="chat-panel" hidden={!isOpen} aria-labelledby="chat-title">
                <header className="chat-header">
                    <div>
                        <h2 id="chat-title">{t("chatTitle", "FixBot")}</h2>
                        <p>{t("chatSubtitle", "FixHub AI assistant")}</p>
                    </div>
                    <div className="chat-header-actions">
                        <button type="button" className="chat-icon-btn chat-reset" aria-label={t("chatReset", "New conversation")} onClick={resetConversation}>↺</button>
                        <button type="button" className="chat-icon-btn chat-close" aria-label={t("chatClose", "Close")} onClick={close}>✕</button>
                    </div>
                </header>

                <div className="chat-messages" aria-live="polite" ref={messagesRef}>
                    <Bubble t={t} message={{ role: "assistant", content: t("chatWelcome", "Hi! I'm FixBot. Tell me what's wrong with your computer and I'll help you find a solution.") }} />
                    {history.map((message, index) => (
                        <Bubble key={index} t={t} message={message} onUseDraft={sendDraftToContact} />
                    ))}
                    {isBusy && (
                        <div className="chat-bubble chat-bubble-bot chat-typing" aria-label={t("chatTyping", "FixBot is typing")}>
                            <span></span><span></span><span></span>
                        </div>
                    )}
                    {error && (
                        <div className="chat-error" role="alert">
                            {error}{" "}
                            <button type="button" className="chat-retry" onClick={retryLast}>{t("retry", "Try again")}</button>
                        </div>
                    )}
                </div>

                <div className="chat-chips">
                    <button type="button" className="chip" disabled={isBusy} onClick={() => sendMessage(t("chatChipSlowPrompt"))}>
                        {t("chatChipSlow", "My PC is slow")}
                    </button>
                    <button type="button" className="chip" disabled={isBusy} onClick={() => sendMessage(t("chatChipServicePrompt"))}>
                        {t("chatChipService", "Which service do I need?")}
                    </button>
                    <button type="button" className="chip chip-draft" disabled={isBusy} onClick={requestDraft}>
                        {t("chatChipDraft", "Write my repair request")}
                    </button>
                </div>

                <form className="chat-form" onSubmit={handleSubmit}>
                    <label htmlFor="chat-input" className="visually-hidden">{t("chatInputLabel", "Message")}</label>
                    <input
                        ref={inputRef}
                        id="chat-input"
                        type="text"
                        maxLength={MAX_INPUT}
                        autoComplete="off"
                        placeholder={t("chatPlaceholder", "Describe your problem...")}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        disabled={isBusy}
                    />
                    <button type="submit" className="chat-send" aria-label={t("chatSend", "Send")} disabled={isBusy}>➤</button>
                </form>
                <p className="chat-disclaimer">{t("chatDisclaimer", "AI answers can be wrong. For serious issues, ask a technician.")}</p>
            </section>
        </div>
    );
}
