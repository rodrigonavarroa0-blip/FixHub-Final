/* MAIN - REACT ENTRY POINT */
/* Starts React inside <div id="root"> (index.html). The providers share global state with
   every component: language (LanguageProvider), notifications (ToastProvider) and the
   FixBot chat (ChatProvider). */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import App from "./App.jsx";
import "./styles/myStyles.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <LanguageProvider>
            <ToastProvider>
                <ChatProvider>
                    <App />
                </ChatProvider>
            </ToastProvider>
        </LanguageProvider>
    </StrictMode>,
);
