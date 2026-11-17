/* MAIN - JAVASCRIPT */
/* Entry point loaded by EVERY page: builds the shared layout, the AI chat widget,
   applies the saved language and starts the scroll animations.
   Pages with their own logic also load a module from js/pages/. */

import { mountLayout } from "./components/layout.js";
import { mountChatWidget } from "./components/chat-widget.js";
import { applyLanguage, getLanguage } from "./core/i18n.js";
import { observeReveal } from "./core/ui.js";

mountLayout();
mountChatWidget();

//Translate right away with the cached dictionary (if any); i18n.js translates again
//when the fresh translations.json finishes downloading.
applyLanguage(getLanguage());

observeReveal();
