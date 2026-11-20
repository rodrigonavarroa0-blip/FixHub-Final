/* FOOTER - COMPONENT */

import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Footer() {
    const { t } = useLanguage();
    return (
        <footer className="footer">
            <p>{t("footerText")}</p>
            <p className="footer-links">
                <Link to="/contact">{t("navContact")}</Link>
                <span aria-hidden="true">·</span>
                <Link to="/admin">{t("footerAdmin")}</Link>
            </p>
        </footer>
    );
}
