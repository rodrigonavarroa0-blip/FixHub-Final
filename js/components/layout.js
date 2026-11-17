/* LAYOUT - JAVASCRIPT */
/* Reusable header (navigation) and footer. Every page only has two placeholders:
   <div id="site-header"></div> and <div id="site-footer"></div>, so the menu is
   written once here instead of being copied into every HTML file. */

import { toggleLanguage } from "../core/i18n.js";

//Navigation items: i18n key, file and the data-page value of <body> that marks it as active.
const NAV_ITEMS = [
    { key: "navHome", href: "index.html", page: "home", label: "Home" },
    { key: "navDiagnose", href: "diagnose.html", page: "diagnose", label: "Diagnose" },
    { key: "navGuides", href: "guide.html", page: "guides", label: "Guides" },
    { key: "navMaintenance", href: "maintenance.html", page: "maintenance", label: "Maintenance" },
    { key: "navServices", href: "services.html", page: "services", label: "Services" },
    { key: "navContact", href: "contact.html", page: "contact", label: "Contact" },
];

function headerTemplate(currentPage) {
    const links = NAV_ITEMS.map((item) => {
        const active = item.page === currentPage;
        return `<a data-i18n-block="${item.key}" href="${item.href}"${active ? ' class="active" aria-current="page"' : ""}>${item.label}</a>`;
    }).join("");

    return `
    <header class="header">
        <input type="checkbox" id="nav-toggle" class="nav-toggle">
        <a class="logo" href="index.html" aria-label="FixHub">
            <img class="logo-img" src="../resources/LOGOS/fixhub_logo_azul.png" alt="FixHub">
        </a>
        <label for="nav-toggle" class="hamburger" data-i18n-aria-label="navMenuLabel" aria-label="Menu"></label>
        <nav class="flex-nav" aria-label="navbar">${links}</nav>
        <button id="lang-btn" type="button">Español</button>
    </header>`;
}

function footerTemplate() {
    return `
    <footer class="footer">
        <p data-i18n-block="footerText">Copyright © 2026 FixHub. All rights reserved.</p>
        <p class="footer-links">
            <a href="contact.html" data-i18n-block="navContact">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="admin.html" data-i18n-block="footerAdmin">Admin</a>
        </p>
    </footer>`;
}

export function mountLayout() {
    const currentPage = document.body.dataset.page;

    const header = document.getElementById("site-header");
    if (header) {
        header.outerHTML = headerTemplate(currentPage);
        document.getElementById("lang-btn").addEventListener("click", toggleLanguage);
    }

    const footer = document.getElementById("site-footer");
    if (footer) {
        footer.outerHTML = footerTemplate();
    }
}
