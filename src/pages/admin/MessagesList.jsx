/* MESSAGES LIST - ADMIN */
/* Contact requests saved by the Contact page, with a status filter,
   a status selector for each message and a delete button. */

import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { formatDate, localized } from "../../utils/format.js";
import StateBox from "../../components/StateBox.jsx";
import LoadingButton from "../../components/LoadingButton.jsx";

//Same values as the CHECK constraint of contact_messages.status.
const STATUSES = [
    { value: "new", key: "statusNew" },
    { value: "in_progress", key: "statusInProgress" },
    { value: "resolved", key: "statusResolved" },
];

export default function MessagesList({ messages, services, busyId, onStatusChange, onDelete }) {
    const { lang, t } = useLanguage();
    const [filter, setFilter] = useState("all");

    const visible = filter === "all" ? messages : messages.filter((message) => message.status === filter);

    function serviceName(id) {
        const service = services.find((item) => item.id === id);
        return service ? localized(service, "name", lang) : t("contactServiceNone");
    }

    return (
        <>
            <div className="section-heading">
                <h2>{t("adminMessagesTitle")}</h2>
                <label className="inline-select">
                    <span>{t("adminFilter")}</span>
                    <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                        <option value="all">{t("adminFilterAll")}</option>
                        {STATUSES.map((status) => <option key={status.value} value={status.value}>{t(status.key)}</option>)}
                    </select>
                </label>
            </div>

            <div className="messages-list" aria-live="polite">
                {!visible.length && <StateBox type="empty" message={t("adminNoMessages")} />}

                {visible.map((message) => {
                    const busy = busyId === `message-${message.id}`;
                    return (
                        <article key={message.id} className={`card message-card status-${message.status}`}>
                            <header className="message-header">
                                <div>
                                    <h3>{message.name}</h3>
                                    <p className="message-meta">
                                        <a href={`mailto:${message.email}`}>{message.email}</a>
                                        {message.phone && ` · ${message.phone}`}
                                        {` · ${formatDate(message.created_at, lang)}`}
                                    </p>
                                </div>
                                <span className="service-category">{serviceName(message.service_id)}</span>
                            </header>
                            <p className="message-body">{message.message}</p>
                            <div className="message-actions">
                                <label>
                                    <span className="visually-hidden">{t("adminStatus")}</span>
                                    <select value={message.status} disabled={busy}
                                        onChange={(event) => onStatusChange(message, event.target.value)}>
                                        {STATUSES.map((status) => <option key={status.value} value={status.value}>{t(status.key)}</option>)}
                                    </select>
                                </label>
                                <LoadingButton className="button button-small button-danger" loading={busy} onClick={() => onDelete(message)}>
                                    {t("adminDelete")}
                                </LoadingButton>
                            </div>
                        </article>
                    );
                })}
            </div>
        </>
    );
}
