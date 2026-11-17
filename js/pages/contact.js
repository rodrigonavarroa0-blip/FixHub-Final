/* CONTACT PAGE - JAVASCRIPT */
/* Real contact form: validates the fields, saves the message in Supabase and shows
   loading, error and success states. It can be pre-filled from the catalog
   (?service=ID) or from a message written by the AI assistant. */

import { listServices, sendContactMessage } from "../core/supabase.js";
import { onLanguageChange, t } from "../core/i18n.js";
import { clearFieldErrors, errorMessage, escapeHtml, localized, setButtonLoading, setFieldError, showToast } from "../core/ui.js";
import { DRAFT_KEY } from "../components/chat-widget.js";

const form = document.getElementById("contact-form");
const successPanel = document.getElementById("contact-success");
const feedback = document.getElementById("contact-feedback");
const submitButton = form.querySelector("button[type='submit']");
const counter = document.getElementById("contact-message-counter");

const fields = {
    name: document.getElementById("contact-name"),
    email: document.getElementById("contact-email"),
    phone: document.getElementById("contact-phone"),
    service: document.getElementById("contact-service"),
    message: document.getElementById("contact-message"),
    website: document.getElementById("contact-website"), //honeypot: humans never see or fill it
};

//Same limits as the CHECK constraints in supabase/schema.sql.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^[+\d\s()-]{6,30}$/;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

let services = [];
const requestedServiceId = new URLSearchParams(window.location.search).get("service");

/* -------------------------------------------------------------- */
/* SERVICE SELECT                                                 */
/* -------------------------------------------------------------- */

function renderServiceOptions() {
    const selected = fields.service.value || requestedServiceId || "";
    fields.service.innerHTML = `<option value="">${escapeHtml(t("contactServiceNone", "Not sure yet"))}</option>` +
        services.map((service) => `<option value="${service.id}">${escapeHtml(localized(service, "name"))}</option>`).join("");
    fields.service.value = services.some((service) => String(service.id) === selected) ? selected : "";
}

async function loadServices() {
    fields.service.disabled = true;
    fields.service.innerHTML = `<option value="">${escapeHtml(t("loading", "Loading..."))}</option>`;
    try {
        services = await listServices();
    } catch {
        services = []; //The form still works without choosing a service.
    }
    fields.service.disabled = false;
    renderServiceOptions();
}

/* -------------------------------------------------------------- */
/* VALIDATION                                                     */
/* -------------------------------------------------------------- */

//Returns an object { fieldName: errorMessage } with only the invalid fields.
function validate(values) {
    const errors = {};
    if (values.name.length < 2 || values.name.length > 80) {
        errors.name = t("contactErrorName", "Please enter your name (2 to 80 characters).");
    }
    if (!EMAIL_PATTERN.test(values.email) || values.email.length > 120) {
        errors.email = t("contactErrorEmail", "Please enter a valid email address.");
    }
    if (values.phone && !PHONE_PATTERN.test(values.phone)) {
        errors.phone = t("contactErrorPhone", "Use only numbers, spaces, +, - or parentheses.");
    }
    if (values.message.length < MESSAGE_MIN || values.message.length > MESSAGE_MAX) {
        errors.message = t("contactErrorMessage", "Describe the problem in at least 10 characters.");
    }
    return errors;
}

function readValues() {
    return {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        phone: fields.phone.value.trim(),
        message: fields.message.value.trim(),
        serviceId: fields.service.value ? Number(fields.service.value) : null,
    };
}

function updateCounter() {
    counter.textContent = `${fields.message.value.length} / ${MESSAGE_MAX}`;
}

function showFeedback(message) {
    feedback.textContent = message;
    feedback.hidden = !message;
}

/* -------------------------------------------------------------- */
/* SUBMIT                                                         */
/* -------------------------------------------------------------- */

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFeedback("");
    clearFieldErrors(form);

    const values = readValues();
    const errors = validate(values);
    Object.entries(errors).forEach(([name, message]) => setFieldError(fields[name], message));
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
        fields[firstInvalid].focus();
        return;
    }

    //Bots fill every input, including the hidden one: pretend it worked and stop.
    if (fields.website.value) {
        showSuccess();
        return;
    }

    setButtonLoading(submitButton, true, t("contactSending", "Sending..."));
    try {
        await sendContactMessage({
            name: values.name,
            email: values.email,
            phone: values.phone || null,
            service_id: values.serviceId,
            message: values.message,
        });
        showSuccess();
    } catch (error) {
        showFeedback(`${t("contactErrorSend", "Your message could not be sent.")} ${errorMessage(error)}`);
    } finally {
        setButtonLoading(submitButton, false);
    }
});

function showSuccess() {
    form.reset();
    updateCounter();
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
}

document.getElementById("contact-again").addEventListener("click", () => {
    successPanel.hidden = true;
    form.hidden = false;
    fields.name.focus();
});

//Clear a field's error as soon as the visitor starts fixing it.
Object.values(fields).forEach((input) => input.addEventListener("input", () => setFieldError(input, "")));
fields.message.addEventListener("input", updateCounter);

/* -------------------------------------------------------------- */
/* PRE-FILL FROM THE AI ASSISTANT                                 */
/* -------------------------------------------------------------- */

const draft = sessionStorage.getItem(DRAFT_KEY);
if (draft) {
    fields.message.value = draft.slice(0, MESSAGE_MAX);
    sessionStorage.removeItem(DRAFT_KEY);
    showToast(t("contactDraftLoaded", "FixBot's message was added. Review it and complete your details."), "info");
}

updateCounter();
onLanguageChange(renderServiceOptions);
loadServices();
