/* LANGUAGE CONTEXT - REACT */
/* Shares the current language (English / Spanish) with every component.
   - useLanguage() returns { lang, t, toggleLanguage }.
   - t("key") looks up the text in translations.json (English is the fallback).
   When the language changes, React re-renders every component that uses t(). */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations.json";

const LANGUAGE_KEY = "preferredLang";
const SUPPORTED = ["en", "es"];

const LanguageContext = createContext(null);

//The language the visitor chose last time (localStorage survives closing the browser).
function initialLanguage() {
    try {
        const saved = localStorage.getItem(LANGUAGE_KEY);
        return SUPPORTED.includes(saved) ? saved : "en";
    } catch {
        return "en";
    }
}

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(initialLanguage);

    //Side effects of a language change: remember it and update <html lang> for screen readers.
    useEffect(() => {
        document.documentElement.lang = lang;
        try {
            localStorage.setItem(LANGUAGE_KEY, lang);
        } catch {
            //Private mode: the choice simply is not remembered.
        }
    }, [lang]);

    const t = useCallback(
        (key, fallback = key) => translations[lang]?.[key] ?? translations.en?.[key] ?? fallback,
        [lang],
    );

    const toggleLanguage = useCallback(() => {
        setLang((current) => (current === "en" ? "es" : "en"));
    }, []);

    //useMemo keeps the same object between renders so consumers only re-render when lang changes.
    const value = useMemo(() => ({ lang, t, toggleLanguage }), [lang, t, toggleLanguage]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used inside <LanguageProvider>");
    }
    return context;
}
