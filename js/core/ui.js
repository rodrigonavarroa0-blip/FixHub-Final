/* UI - JAVASCRIPT */
/* Reusable helpers for the user interface: safe text, formatting, loading/error/empty
   states, form field errors, toast notifications and scroll animations. */

import { CONFIG } from "../config.js";
import { t, getLanguage } from "./i18n.js";

//Escapes text before putting it inside innerHTML, so data from the database or the AI
//can never inject HTML or scripts into the page (prevents XSS).
export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function formatPrice(amount) {
    const locale = getLanguage() === "es" ? "es" : "en-US";
    return new Intl.NumberFormat(locale, { style: "currency", currency: CONFIG.currency }).format(amount);
}

export function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatDate(isoDate) {
    const locale = getLanguage() === "es" ? "es" : "en-US";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(isoDate));
}

//Picks the English or Spanish column of a database row: localized(service, "name") -> name_en / name_es.
export function localized(row, field) {
    return row[`${field}_${getLanguage()}`] || row[`${field}_en`] || "";
}

//Turns an ApiError into a friendly, translated message.
export function errorMessage(error) {
    if (error?.code === "not_configured") return t("errorNotConfigured", error.message);
    if (error?.code === "network") return t("errorNetwork", error.message);
    if (error?.status === 401 || error?.code === "session_expired") return t("errorSession", error.message);
    return error?.message || t("errorGeneric", "Something went wrong. Please try again.");
}

/* -------------------------------------------------------------- */
/* LOADING / ERROR / EMPTY STATES                                 */
/* -------------------------------------------------------------- */

//Shows a spinner on a button and disables it while a request is running.
export function setButtonLoading(button, isLoading, loadingText = t("loading", "Loading...")) {
    if (isLoading) {
        button.dataset.originalHtml = button.innerHTML;
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${escapeHtml(loadingText)}`;
    } else {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        if (button.dataset.originalHtml !== undefined) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }
}

//Grey placeholder cards shown while the catalog is loading.
export function renderSkeletonCards(container, count = 3) {
    container.innerHTML = Array.from({ length: count }, () => `
        <article class="card skeleton-card" aria-hidden="true">
            <span class="skeleton skeleton-line short"></span>
            <span class="skeleton skeleton-line title"></span>
            <span class="skeleton skeleton-line"></span>
            <span class="skeleton skeleton-line"></span>
        </article>`).join("");
    container.setAttribute("aria-busy", "true");
}

//Replaces `container` with a message box. type: "error" | "empty" | "info".
export function renderState(container, { type = "info", title, message, retryLabel, onRetry } = {}) {
    container.removeAttribute("aria-busy");
    container.innerHTML = `
        <div class="state-box state-${type}" role="${type === "error" ? "alert" : "status"}">
            ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
            <p>${escapeHtml(message)}</p>
            ${onRetry ? `<button type="button" class="button button-primary state-retry">${escapeHtml(retryLabel || t("retry", "Try again"))}</button>` : ""}
        </div>`;
    if (onRetry) {
        container.querySelector(".state-retry").addEventListener("click", onRetry);
    }
}

/* -------------------------------------------------------------- */
/* FORM FIELD ERRORS                                              */
/* -------------------------------------------------------------- */

//Shows an error under a field (expects <small class="field-error" id="{inputId}-error">).
export function setFieldError(input, message) {
    const errorElement = document.getElementById(`${input.id}-error`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.classList.toggle("is-invalid", Boolean(message));
    if (errorElement) {
        errorElement.textContent = message || "";
    }
}

export function clearFieldErrors(form) {
    form.querySelectorAll("input, select, textarea").forEach((input) => setFieldError(input, ""));
}

/* -------------------------------------------------------------- */
/* TOASTS                                                         */
/* -------------------------------------------------------------- */

export function showToast(message, type = "success") {
    let region = document.getElementById("toast-region");
    if (!region) {
        region = document.createElement("div");
        region.id = "toast-region";
        region.className = "toast-region";
        region.setAttribute("aria-live", "polite");
        document.body.appendChild(region);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("toast-hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3500);
}

/* -------------------------------------------------------------- */
/* SCROLL ANIMATIONS                                              */
/* -------------------------------------------------------------- */

//Fades in elements with class "reveal" when they enter the screen.
//IntersectionObserver tells us when an element becomes visible without listening to every scroll event.
let revealObserver = null;

export function observeReveal(root = document) {
    const elements = root.querySelectorAll(".reveal:not(.is-visible)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
    }
    if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
    }
    elements.forEach((element, index) => {
        //Small stagger so cards in a grid appear one after another.
        element.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`;
        revealObserver.observe(element);
    });
}
