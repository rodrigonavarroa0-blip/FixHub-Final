/* CHAT CONTEXT - REACT */
/* Lets any page talk to the FixBot widget:
   - openChat(): used by the "Chat with FixBot" buttons on Home, Services and Contact.
   - draft / setDraft: the repair request written by the AI travels to the Contact form. */

import { createContext, useContext, useMemo, useState } from "react";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState("");

    const value = useMemo(() => ({
        isOpen,
        setIsOpen,
        openChat: () => setIsOpen(true),
        draft,
        setDraft,
    }), [isOpen, draft]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    return useContext(ChatContext);
}
