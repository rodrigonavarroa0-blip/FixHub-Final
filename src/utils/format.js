/* FORMAT - JAVASCRIPT */
/* Small pure functions to show prices, times, dates, database rows and errors.
   They receive the language as a parameter, so they work anywhere (no React needed). */

import { CONFIG } from "../config.js";

const LOCALES = { en: "en-US", es: "es" };

export function formatPrice(amount, lang) {
    return new Intl.NumberFormat(LOCALES[lang], { style: "currency", currency: CONFIG.currency }).format(amount);
}

export function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatDate(isoDate, lang) {
    return new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: "medium", timeStyle: "short" }).format(new Date(isoDate));
}

//Picks the English or Spanish column of a database row: localized(service, "name", "es") -> service.name_es.
export function localized(row, field, lang) {
    return row[`${field}_${lang}`] || row[`${field}_en`] || "";
}

//Turns an ApiError (src/services/supabase.js) into a friendly, translated message.
export function errorMessage(error, t) {
    if (error?.code === "not_configured") return t("errorNotConfigured", error.message);
    if (error?.code === "network") return t("errorNetwork", error.message);
    if (error?.status === 401 || error?.code === "session_expired") return t("errorSession", error.message);
    return error?.message || t("errorGeneric", "Something went wrong. Please try again.");
}

//Same rules as the CHECK constraints in supabase/schema.sql.
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_PATTERN = /^[+\d\s()-]{6,30}$/;
