/* SERVICES TABLE - ADMIN */
/* Lists every service (also the hidden ones). On phones the CSS turns each row into a card,
   using the data-label attribute as the title of each value. */

import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { categoryKey } from "../../utils/categories.js";
import { formatDuration, formatPrice, localized } from "../../utils/format.js";
import StateBox from "../../components/StateBox.jsx";
import LoadingButton from "../../components/LoadingButton.jsx";

export default function ServicesTable({ services, busyId, onEdit, onToggle, onDelete }) {
    const { lang, t } = useLanguage();

    if (!services.length) {
        return <StateBox type="empty" message={t("adminNoServices")} />;
    }

    return (
        <div className="table-wrapper" aria-live="polite">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>{t("adminColName")}</th>
                        <th>{t("adminColCategory")}</th>
                        <th>{t("servicePrice")}</th>
                        <th>{t("serviceDuration")}</th>
                        <th>{t("adminColVisible")}</th>
                        <th><span className="visually-hidden">{t("adminColActions")}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((service) => {
                        const busy = busyId === `service-${service.id}`;
                        return (
                            <tr key={service.id} className={service.is_active ? "" : "is-inactive"}>
                                <td data-label={t("adminColName")}><strong>{localized(service, "name", lang)}</strong></td>
                                <td data-label={t("adminColCategory")}>{t(categoryKey(service.category))}</td>
                                <td data-label={t("servicePrice")}>{formatPrice(service.price, lang)}</td>
                                <td data-label={t("serviceDuration")}>{formatDuration(service.duration_minutes)}</td>
                                <td data-label={t("adminColVisible")}>
                                    <LoadingButton className={`badge-toggle ${service.is_active ? "on" : "off"}`} loading={busy}
                                        onClick={() => onToggle(service)}>
                                        {service.is_active ? t("adminVisible") : t("adminHidden")}
                                    </LoadingButton>
                                </td>
                                <td className="table-actions">
                                    <button type="button" className="button button-small" disabled={busy} onClick={() => onEdit(service)}>
                                        {t("adminEdit")}
                                    </button>
                                    <LoadingButton className="button button-small button-danger" loading={busy} onClick={() => onDelete(service)}>
                                        {t("adminDelete")}
                                    </LoadingButton>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
