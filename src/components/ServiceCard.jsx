/* SERVICE CARD - COMPONENT */
/* Card for one catalog service (used on Home and on the Services page).
   React escapes every {value} automatically, so data from the database can never inject HTML. */

import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { categoryKey } from "../utils/categories.js";
import { formatDuration, formatPrice, localized } from "../utils/format.js";
import Reveal from "./Reveal.jsx";

export default function ServiceCard({ service, index }) {
    const { lang, t } = useLanguage();
    return (
        <Reveal as="article" className="card service-card" index={index}>
            <span className={`service-category category-${service.category}`}>{t(categoryKey(service.category))}</span>
            <h3>{localized(service, "name", lang)}</h3>
            <p>{localized(service, "description", lang)}</p>
            <dl className="service-meta">
                <div><dt>{t("servicePrice", "Price")}</dt><dd>{formatPrice(service.price, lang)}</dd></div>
                <div><dt>{t("serviceDuration", "Estimated time")}</dt><dd>{formatDuration(service.duration_minutes)}</dd></div>
            </dl>
            <Link className="button button-primary" to={`/contact?service=${service.id}`}>
                {t("serviceRequest", "Request this service")}
            </Link>
        </Reveal>
    );
}
