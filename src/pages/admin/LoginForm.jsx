/* LOGIN FORM - ADMIN */
/* Email + password with Supabase Auth. After signing in, it asks the database
   (function is_admin) if this user really is an administrator. */

import { useEffect, useState } from "react";
import { isCurrentUserAdmin, signIn, signOut } from "../../services/supabase.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { EMAIL_PATTERN, errorMessage } from "../../utils/format.js";
import { fieldProps } from "../../components/FormField.jsx";
import LoadingButton from "../../components/LoadingButton.jsx";

export default function LoginForm({ message, onSuccess, onDenied }) {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [feedback, setFeedback] = useState(message);
    const [loading, setLoading] = useState(false);

    //Messages from the parent (logout, expired session) replace the current one.
    useEffect(() => setFeedback(message), [message]);

    async function handleSubmit(event) {
        event.preventDefault();
        setFeedback("");

        const formErrors = {};
        if (!EMAIL_PATTERN.test(email.trim())) formErrors.email = t("contactErrorEmail");
        if (!password) formErrors.password = t("loginErrorPassword");
        setErrors(formErrors);
        if (Object.keys(formErrors).length) {
            return;
        }

        setLoading(true);
        try {
            const session = await signIn(email.trim(), password);
            if (!(await isCurrentUserAdmin())) {
                signOut();
                setLoading(false);
                onDenied(t("loginNotAdmin"));
                return;
            }
            onSuccess(session);
        } catch (error) {
            //Supabase answers 400 for wrong credentials: one generic message for both fields.
            setFeedback(error.status === 400 ? t("loginInvalid") : errorMessage(error, t));
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <main className="auth-layout">
                <section className="auth-intro">
                    <p className="auth-tagline">{t("adminIntroTagline")}</p>
                    <h1>{t("adminIntroTitle")}</h1>
                    <p className="auth-desc">{t("adminIntroDesc")}</p>
                    <ul>
                        <li>{t("adminIntroItem1")}</li>
                        <li>{t("adminIntroItem2")}</li>
                        <li>{t("adminIntroItem3")}</li>
                    </ul>
                </section>

                <div className="auth-card">
                    <p className="auth-tagline">{t("loginCardTagline")}</p>
                    <h2>{t("adminLoginTitle")}</h2>

                    <form className="auth-form" noValidate onSubmit={handleSubmit}>
                        {feedback && <p className="form-alert" role="alert">{feedback}</p>}

                        <label htmlFor="login-email">{t("contactEmail")}</label>
                        <input {...fieldProps("login-email", errors.email)} type="email" autoComplete="username"
                            value={email} onChange={(event) => setEmail(event.target.value)} />
                        <small className="field-error" id="login-email-error">{errors.email}</small>

                        <label htmlFor="login-password">{t("loginCardPassword")}</label>
                        <input {...fieldProps("login-password", errors.password)} type="password" autoComplete="current-password"
                            value={password} onChange={(event) => setPassword(event.target.value)} />
                        <small className="field-error" id="login-password-error">{errors.password}</small>

                        <LoadingButton type="submit" loading={loading} loadingText={t("loginLoading")}>
                            {t("loginCardButton")}
                        </LoadingButton>
                    </form>
                </div>
            </main>
        </div>
    );
}
