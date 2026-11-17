/* HOME PAGE - JAVASCRIPT */
/* Shows the first services of the catalog as "popular services". If the catalog cannot be
   loaded, the section is simply hidden so the home page still looks complete. */

import { listServices } from "../core/supabase.js";
import { onLanguageChange } from "../core/i18n.js";
import { observeReveal, renderSkeletonCards } from "../core/ui.js";
import { serviceCardTemplate } from "../components/service-card.js";

const section = document.getElementById("featured-services");
const grid = document.getElementById("featured-grid");
const FEATURED_COUNT = 3;

let featured = [];

function render() {
    grid.removeAttribute("aria-busy");
    grid.innerHTML = featured.map(serviceCardTemplate).join("");
    observeReveal(grid);
}

async function load() {
    renderSkeletonCards(grid, FEATURED_COUNT);
    try {
        featured = (await listServices()).slice(0, FEATURED_COUNT);
        if (!featured.length) {
            section.hidden = true;
            return;
        }
        render();
    } catch {
        section.hidden = true;
    }
}

onLanguageChange(() => {
    if (featured.length) render();
});
load();
