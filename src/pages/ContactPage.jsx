/* CONTACT PAGE */
/* Real contact form: validates the fields, saves the message in Supabase and shows
   loading, error and success states. It can be pre-filled from the catalog
   (/contact?service=ID) or with the repair request written by FixBot. */

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { sendContactMessage } from "../services/supabase.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useServices } from "../hooks/useServices.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { EMAIL_PATTERN, PHONE_PATTERN, errorMessage, localized } from "../utils/format.js";
import PageHero from "../components/PageHero.jsx";
import Reveal from "../components/Reveal.jsx";
import FormField, { fieldProps } from "../components/FormField.jsx";
import LoadingButton from "../components/LoadingButton.jsx";

//Same limits as the CHECK constraints in supabase/schema.sql.
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;
const EMPTY_FORM = { name: "", email: "", phone: "", serviceId: "", message: "", website: "" };

//Returns { fieldName: errorMessage } with only the invalid fields.
function validate(values, t) {
    const errors = {};
    const name = values.name.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    const message = values.message.trim();
    if (name.length < 2 || name.length > 80) errors.name = t("contactErrorName");
    if (!EMAIL_PATTERN.test(email) || email.length > 120) errors.email = t("contactErrorEmail");
    if (phone && !PHONE_PATTERN.test(phone)) errors.phone = t("contactErrorPhone");
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) errors.message = t("contactErrorMessage");
    return errors;
}

export default function ContactPage() {
    const { lang, t } = useLanguage();
    const { openChat, draft, setDraft } = useChat();
    const showToast = useToast();
    const { services, loading: servicesLoading } = useServices();
    const [searchParams] = useSearchParams();
    usePageTitle(t("navContact"));

    const [values, setValues] = useState({ ...EMPTY_FORM, serviceId: searchParams.get("service") ?? "" });
    const [errors, setErrors] = useState({});
    const [feedback, setFeedback] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const inputRefs = useRef({});
    const successRef = useRef(null);

    //If the visitor arrives from a service card, select that service once the catalog is loaded.
    useEffect(() => {
        const requested = searchParams.get("service");
        if (requested) {
            setValues((current) => ({ ...current, serviceId: requested }));
        }
    }, [searchParams]);

    //Pre-fill with the message written by FixBot (it arrives through ChatContext).
    useEffect(() => {
        if (draft) {
            setValues((current) => ({ ...current, message: draft.slice(0, MESSAGE_MAX) }));
            setDraft("");
            setSent(false);
            showToast(t("contactDraftLoaded"), "info");
        }
    }, [draft, setDraft, showToast, t]);

    useEffect(() => {
        if (sent) successRef.current?.focus();
    }, [sent]);

    //One handler for every field: the input's name says which value to update.
    function handleChange(event) {
        const { name, value } = event.target;
        setValues((current) => ({ ...current, [name]: value }));
        //Clear a field's error as soon as the visitor starts fixing it.
        setErrors((current) => ({ ...current, [name]: "" }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setFeedback("");

        const formErrors = validate(values, t);
        setErrors(formErrors);
        const firstInvalid = Object.keys(formErrors)[0];
        if (firstInvalid) {
            inputRefs.current[firstInvalid]?.focus();
            return;
        }

        //Honeypot: bots fill every input, including the hidden one. Pretend it worked and stop.
        if (values.website) {
            setSent(true);
            return;
        }

        setSending(true);
        try {
            await sendContactMessage({
                name: values.name.trim(),
                email: values.email.trim(),
                phone: values.phone.trim() || null,
                service_id: values.serviceId ? Number(values.serviceId) : null,
                message: values.message.trim(),
            });
            setValues(EMPTY_FORM);
            setSent(true);
        } catch (error) {
            setFeedback(`${t("contactErrorSend")} ${errorMessage(error, t)}`);
        } finally {
            setSending(false);
        }
    }

    //Only offer the requested service if it really exists in the catalog.
    const serviceExists = services.some((service) => String(service.id) === values.serviceId);

    return (
        <main className="content">
            <PageHero variant="support" taglineKey="supportHeroTagline" titleKey="supportHeroTitle" textKey="supportHeroDesc" />

            <div className="contact-layout">
                {/* WHEN TO ASK FOR HELP */}
                <Reveal as="aside" className="card">
                    <h3>{t("supportCardTitle")}</h3>
                    <ul>
                        {[1, 2, 3, 4].map((number) => <li key={number}>{t(`supportCardItem${number}`)}</li>)}
                    </ul>
                    <p className="contact-note">{t("contactResponseTime")}</p>
                    <button type="button" className="button button-outline" onClick={openChat}>{t("contactAskAi")}</button>
                </Reveal>

                {/* CONTACT FORM */}
                <section className="card form-card" aria-labelledby="contact-title">
                    <h2 id="contact-title">{t("contactTitle")}</h2>

                    {!sent ? (
                        <form id="contact-form" className="form" noValidate onSubmit={handleSubmit}>
                            {feedback && <p className="form-alert" role="alert">{feedback}</p>}

                            <div className="form-row">
                                <FormField id="contact-name" label={t("contactName")} error={errors.name}>
                                    <input {...fieldProps("contact-name", errors.name)} ref={(element) => { inputRefs.current.name = element; }}
                                        name="name" type="text" autoComplete="name" maxLength={80} value={values.name} onChange={handleChange} />
                                </FormField>
                                <FormField id="contact-email" label={t("contactEmail")} error={errors.email}>
                                    <input {...fieldProps("contact-email", errors.email)} ref={(element) => { inputRefs.current.email = element; }}
                                        name="email" type="email" autoComplete="email" maxLength={120} value={values.email} onChange={handleChange} />
                                </FormField>
                            </div>

                            <div className="form-row">
                                <FormField
                                    id="contact-phone"
                                    label={<>{t("contactPhone")} <span className="optional">{t("optional")}</span></>}
                                    error={errors.phone}
                                >
                                    <input {...fieldProps("contact-phone", errors.phone)} ref={(element) => { inputRefs.current.phone = element; }}
                                        name="phone" type="tel" autoComplete="tel" maxLength={30} value={values.phone} onChange={handleChange} />
                                </FormField>
                                <FormField id="contact-service" label={t("contactService")}>
                                    <select id="contact-service" name="serviceId" disabled={servicesLoading}
                                        value={serviceExists ? values.serviceId : ""} onChange={handleChange}>
                                        <option value="">{servicesLoading ? t("loading") : t("contactServiceNone")}</option>
                                        {services.map((service) => (
                                            <option key={service.id} value={String(service.id)}>{localized(service, "name", lang)}</option>
                                        ))}
                                    </select>
                                </FormField>
                            </div>

                            <FormField
                                id="contact-message"
                                label={t("contactMessage")}
                                error={errors.message}
                                footer={<small className="field-counter">{values.message.length} / {MESSAGE_MAX}</small>}
                            >
                                <textarea {...fieldProps("contact-message", errors.message)} ref={(element) => { inputRefs.current.message = element; }}
                                    name="message" rows={6} maxLength={MESSAGE_MAX} placeholder={t("contactMessagePlaceholder")}
                                    value={values.message} onChange={handleChange} />
                            </FormField>

                            {/* Honeypot: hidden from people, bots fill it and get ignored */}
                            <div className="honeypot" aria-hidden="true">
                                <label htmlFor="contact-website">Website</label>
                                <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off"
                                    value={values.website} onChange={handleChange} />
                            </div>

                            <LoadingButton type="submit" loading={sending} loadingText={t("contactSending")}>
                                {t("contactSubmit")}
                            </LoadingButton>
                        </form>
                    ) : (
                        <div className="form-success" tabIndex={-1} role="status" ref={successRef}>
                            <div className="success-icon" aria-hidden="true">✓</div>
                            <h3>{t("contactSuccessTitle")}</h3>
                            <p>{t("contactSuccessDesc")}</p>
                            <button type="button" className="button button-outline" onClick={() => setSent(false)}>
                                {t("contactAgain")}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
