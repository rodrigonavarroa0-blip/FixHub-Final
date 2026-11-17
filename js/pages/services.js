/* SERVICES PAGE - JAVASCRIPT */
/* Loads the catalog from Supabase and lets visitors filter it by category. */

import { listServices } from "../core/supabase.js";
import { onLanguageChange, t } from "../core/i18n.js";
import { errorMessage, observeReveal, renderSkeletonCards, renderState } from "../core/ui.js";
import { serviceCardTemplate } from "../components/service-card.js";

const grid = document.getElementById("services-grid");
const filters = document.getElementById("category-filters");

let services = null; //null = not loaded yet
let activeCategory = "all";
let lastError = null;

function render() {
    if (lastError) {
        renderState(grid, { type: "error", title: t("servicesErrorTitle", "We could not load the services"), message: errorMessage(lastError), onRetry: load });
        return;
    }
    if (!services) {
        return;
    }
    const visible = activeCategory === "all" ? services : services.filter((service) => service.category === activeCategory);
    if (!visible.length) {
        renderState(grid, { type: "empty", message: t("servicesEmpty", "There are no services in this category yet.") });
        return;
    }
    grid.removeAttribute("aria-busy");
    grid.innerHTML = visible.map(serviceCardTemplate).join("");
    observeReveal(grid);
}

async function load() {
    lastError = null;
    renderSkeletonCards(grid, 6);
    try {
        services = await listServices();
    } catch (error) {
        lastError = error;
    }
    render();
}

filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) {
        return;
    }
    activeCategory = button.dataset.category;
    filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    render();
});

onLanguageChange(render);
load();
