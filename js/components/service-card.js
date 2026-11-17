/* SERVICE CARD - JAVASCRIPT */
/* Reusable card for one catalog service (used on the Services page and on Home). */

import { t } from "../core/i18n.js";
import { escapeHtml, formatDuration, formatPrice, localized } from "../core/ui.js";

const CATEGORY_KEYS = {
    repair: "categoryRepair",
    maintenance: "categoryMaintenance",
    upgrade: "categoryUpgrade",
    support: "categorySupport",
};

export function categoryLabel(category) {
    return t(CATEGORY_KEYS[category], category);
}

export function serviceCardTemplate(service) {
    return `
    <article class="card service-card reveal">
        <span class="service-category category-${escapeHtml(service.category)}">${escapeHtml(categoryLabel(service.category))}</span>
        <h3>${escapeHtml(localized(service, "name"))}</h3>
        <p>${escapeHtml(localized(service, "description"))}</p>
        <dl class="service-meta">
            <div><dt>${escapeHtml(t("servicePrice", "Price"))}</dt><dd>${escapeHtml(formatPrice(service.price))}</dd></div>
            <div><dt>${escapeHtml(t("serviceDuration", "Estimated time"))}</dt><dd>${escapeHtml(formatDuration(service.duration_minutes))}</dd></div>
        </dl>
        <a class="button button-primary" href="contact.html?service=${encodeURIComponent(service.id)}#contact-form">${escapeHtml(t("serviceRequest", "Request this service"))}</a>
    </article>`;
}
