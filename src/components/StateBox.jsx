/* STATE BOX - COMPONENT */
/* Message box for error, empty and info states. With onRetry it also shows a "Try again" button. */

import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function StateBox({ type = "info", title, message, onRetry, loading = false }) {
    const { t } = useLanguage();
    return (
        <div className={`state-box state-${type}`} role={type === "error" ? "alert" : "status"}>
            {title && <h3>{title}</h3>}
            <p>
                {loading && <span className="spinner" aria-hidden="true"></span>}
                {message}
            </p>
            {onRetry && (
                <button type="button" className="button button-primary state-retry" onClick={onRetry}>
                    {t("retry", "Try again")}
                </button>
            )}
        </div>
    );
}
