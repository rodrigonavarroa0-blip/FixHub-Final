/* HEADER - COMPONENT */
/* Logo, navigation and language button. The menu is written once here and used by every page.
   On phones the menu opens with the hamburger (the CSS uses a hidden checkbox). */

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import logo from "../../resources/LOGOS/fixhub_logo_azul.png";

//Navigation items: translation key and route.
const NAV_ITEMS = [
    { key: "navHome", to: "/" },
    { key: "navDiagnose", to: "/diagnose" },
    { key: "navGuides", to: "/guides" },
    { key: "navMaintenance", to: "/maintenance" },
    { key: "navServices", to: "/services" },
    { key: "navContact", to: "/contact" },
];

export default function Header() {
    const { lang, t, toggleLanguage } = useLanguage();
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="header">
            <input
                type="checkbox"
                id="nav-toggle"
                className="nav-toggle"
                checked={menuOpen}
                onChange={(event) => setMenuOpen(event.target.checked)}
            />
            <Link className="logo" to="/" aria-label="FixHub" onClick={closeMenu}>
                <img className="logo-img" src={logo} alt="FixHub" />
            </Link>
            <label htmlFor="nav-toggle" className="hamburger" aria-label={t("navMenuLabel", "Menu")}></label>
            <nav className="flex-nav" aria-label="navbar">
                {NAV_ITEMS.map((item) => (
                    //NavLink adds class="active" and aria-current="page" to the current page automatically.
                    <NavLink key={item.to} to={item.to} end onClick={closeMenu}>
                        {t(item.key)}
                    </NavLink>
                ))}
            </nav>
            <button id="lang-btn" type="button" onClick={toggleLanguage}>
                {t("buttonText", lang === "es" ? "English" : "Español")}
            </button>
        </header>
    );
}
