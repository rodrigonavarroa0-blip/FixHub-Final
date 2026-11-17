/* I18N - JAVASCRIPT */
/* This module is in charge of changing the language of the website between English and Spanish.
   - Static text: any element with data-i18n-block="key" (or data-i18n-placeholder="key") is translated.
   - Dynamic text (rendered by JavaScript): use t("key") and re-render inside onLanguageChange(). */

const LANGUAGE_KEY = "preferredLang";
const CACHE_KEY = "fixhub_translations_cache_v2";
const SUPPORTED = ["en", "es"];

//import.meta.url is the address of THIS file, so the path works from any page folder.
const TRANSLATIONS_URL = new URL("../../data/translations.json", import.meta.url);

let translations = {};
let currentLang = "en";
const listeners = new Set();

//1. Remember the language the visitor chose last time (localStorage survives closing the browser).
const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
if (SUPPORTED.includes(savedLanguage)) {
    currentLang = savedLanguage;
}
document.documentElement.lang = currentLang;

//2. Use the copy cached in this tab (sessionStorage) so pages render instantly.
try {
    translations = JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {};
} catch {
    translations = {};
}

//3. Download the latest dictionary. `ready` lets other modules wait for it.
export const ready = fetch(TRANSLATIONS_URL)
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load translations.json file");
        }
        return response.json();
    })
    .then(function (data) {
        translations = data;
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        applyLanguage(currentLang);
    })
    .catch(function (error) {
        console.error("Error loading translations:", error);
    });

//Returns the text for `key` in the current language, falling back to English, then to `fallback`.
export function t(key, fallback = key) {
    return translations[currentLang]?.[key] ?? translations.en?.[key] ?? fallback;
}

export function getLanguage() {
    return currentLang;
}

//Registers a function that runs every time the language changes (used to re-render dynamic content).
export function onLanguageChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

//Translates every element marked with data-i18n-* inside `root` (the whole page by default).
export function translateElements(root = document) {
    const dictionary = translations[currentLang];
    if (!dictionary) {
        return;
    }

    root.querySelectorAll("[data-i18n-block]").forEach(function (element) {
        const value = dictionary[element.getAttribute("data-i18n-block")];
        if (value === undefined) {
            return;
        }
        //Translations with tags (like <b> or <a>) come from our own JSON file, so innerHTML is safe here.
        if (typeof value === "string" && value.includes("<")) {
            element.innerHTML = value;
        } else {
            element.textContent = value;
        }
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach(function (input) {
        const value = dictionary[input.getAttribute("data-i18n-placeholder")];
        if (value !== undefined) {
            input.placeholder = value;
        }
    });

    root.querySelectorAll("[data-i18n-aria-label]").forEach(function (element) {
        const value = dictionary[element.getAttribute("data-i18n-aria-label")];
        if (value !== undefined) {
            element.setAttribute("aria-label", value);
        }
    });
}

export function applyLanguage(lang) {
    if (!SUPPORTED.includes(lang)) {
        return;
    }
    currentLang = lang;
    localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;

    translateElements();

    //The language button always offers the OTHER language.
    const langButton = document.getElementById("lang-btn");
    if (langButton) {
        langButton.textContent = t("buttonText", lang === "es" ? "English" : "Español");
    }

    listeners.forEach((callback) => callback(lang));
}

export function toggleLanguage() {
    const nextLanguage = currentLang === "en" ? "es" : "en";
    //If the dictionary is still downloading, wait for it before switching.
    if (!translations[nextLanguage]) {
        ready.then(() => applyLanguage(nextLanguage));
        return;
    }
    applyLanguage(nextLanguage);
}
