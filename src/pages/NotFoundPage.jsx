/* NOT FOUND PAGE */
/* Shown when the address does not match any route. */

import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import StateBox from "../components/StateBox.jsx";

export default function NotFoundPage() {
    const { t } = useLanguage();
    return (
        <main className="content">
            <StateBox type="empty" title="404" message={t("errorGeneric", "Something went wrong. Please try again.")} />
            <p className="actions"><Link className="button button-primary" to="/">{t("navHome")}</Link></p>
        </main>
    );
}
