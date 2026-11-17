/* ADMIN PAGE - JAVASCRIPT */
/* Private panel: login with Supabase Auth, then manage the service catalog (create, edit,
   hide, delete, generate descriptions with AI) and the messages from the contact form.
   The database also checks every action with Row Level Security, so hiding this page
   is not the only protection. */

import {
    createService, deleteMessage, deleteService, getSession, isCurrentUserAdmin, listMessages,
    listServices, signIn, signOut, updateMessageStatus, updateService,
} from "../core/supabase.js";
import { isSupabaseConfigured } from "../config.js";
import { onLanguageChange, t } from "../core/i18n.js";
import {
    clearFieldErrors, errorMessage, escapeHtml, formatDate, formatDuration, formatPrice, localized,
    renderState, setButtonLoading, setFieldError, showToast,
} from "../core/ui.js";
import { categoryLabel } from "../components/service-card.js";
import { generateServiceDescriptions } from "../ai/assistant.js";

const $ = (id) => document.getElementById(id);

const loginSection = $("admin-login");
const panelSection = $("admin-panel");
const loginForm = $("login-form");
const loginFeedback = $("login-feedback");
const serviceForm = $("service-form");
const serviceFormCard = $("service-form-card");
const servicesList = $("services-list");
const messagesList = $("messages-list");
const messageFilter = $("message-filter");

const serviceFields = {
    name_en: $("service-name-en"),
    name_es: $("service-name-es"),
    category: $("service-category"),
    price: $("service-price"),
    duration_minutes: $("service-duration"),
    sort_order: $("service-sort"),
    description_en: $("service-desc-en"),
    description_es: $("service-desc-es"),
    is_active: $("service-active"),
};

const STATUS_KEYS = { new: "statusNew", in_progress: "statusInProgress", resolved: "statusResolved" };

let services = [];
let messages = [];
let editingId = null; //null = creating a new service

/* -------------------------------------------------------------- */
/* SESSION                                                        */
/* -------------------------------------------------------------- */

function showLogin(message = "") {
    panelSection.hidden = true;
    loginSection.hidden = false;
    loginFeedback.textContent = message;
    loginFeedback.hidden = !message;
}

async function showPanel(session) {
    loginSection.hidden = true;
    panelSection.hidden = false;
    $("admin-email").textContent = session.email;
    await Promise.all([loadServices(), loadMessages()]);
}

//Any 401 (expired or invalid token) sends the admin back to the login form.
function handleError(error, container) {
    if (error?.status === 401 || error?.code === "session_expired") {
        signOut();
        showLogin(t("errorSession", "Your session expired. Please log in again."));
        return;
    }
    if (container) {
        renderState(container, { type: "error", message: errorMessage(error) });
    } else {
        showToast(errorMessage(error), "error");
    }
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(loginForm);
    loginFeedback.hidden = true;

    const email = $("login-email");
    const password = $("login-password");
    let valid = true;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) {
        setFieldError(email, t("contactErrorEmail", "Please enter a valid email address."));
        valid = false;
    }
    if (!password.value) {
        setFieldError(password, t("loginErrorPassword", "Please enter your password."));
        valid = false;
    }
    if (!valid) {
        return;
    }

    const button = loginForm.querySelector("button[type='submit']");
    setButtonLoading(button, true, t("loginLoading", "Signing in..."));
    try {
        const session = await signIn(email.value.trim(), password.value);
        const isAdmin = await isCurrentUserAdmin();
        if (!isAdmin) {
            signOut();
            showLogin(t("loginNotAdmin", "This account does not have admin access."));
            return;
        }
        loginForm.reset();
        await showPanel(session);
    } catch (error) {
        //Supabase answers 400 for wrong credentials; show one generic message for both fields.
        const message = error.status === 400 ? t("loginInvalid", "Incorrect email or password.") : errorMessage(error);
        showLogin(message);
    } finally {
        setButtonLoading(button, false);
    }
});

$("logout-btn").addEventListener("click", () => {
    signOut();
    showLogin(t("logoutDone", "You have been logged out."));
});

/* -------------------------------------------------------------- */
/* TABS                                                           */
/* -------------------------------------------------------------- */

document.querySelectorAll("[role='tab']").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll("[role='tab']").forEach((other) => {
            const selected = other === tab;
            other.setAttribute("aria-selected", String(selected));
            $(other.getAttribute("aria-controls")).hidden = !selected;
        });
    });
});

/* -------------------------------------------------------------- */
/* STATS                                                          */
/* -------------------------------------------------------------- */

function renderStats() {
    $("stat-services").textContent = services.length;
    $("stat-active").textContent = services.filter((service) => service.is_active).length;
    $("stat-new").textContent = messages.filter((message) => message.status === "new").length;
}

/* -------------------------------------------------------------- */
/* SERVICES                                                       */
/* -------------------------------------------------------------- */

async function loadServices() {
    servicesList.innerHTML = `<p class="state-box state-info"><span class="spinner" aria-hidden="true"></span>${escapeHtml(t("loading", "Loading..."))}</p>`;
    try {
        services = await listServices({ includeInactive: true });
        renderServices();
    } catch (error) {
        handleError(error, servicesList);
    }
}

function renderServices() {
    renderStats();
    if (!services.length) {
        renderState(servicesList, { type: "empty", message: t("adminNoServices", "No services yet. Create the first one.") });
        return;
    }
    const rows = services.map((service) => `
        <tr class="${service.is_active ? "" : "is-inactive"}">
            <td data-label="${escapeHtml(t("adminColName", "Service"))}"><strong>${escapeHtml(localized(service, "name"))}</strong></td>
            <td data-label="${escapeHtml(t("adminColCategory", "Category"))}">${escapeHtml(categoryLabel(service.category))}</td>
            <td data-label="${escapeHtml(t("servicePrice", "Price"))}">${escapeHtml(formatPrice(service.price))}</td>
            <td data-label="${escapeHtml(t("serviceDuration", "Estimated time"))}">${escapeHtml(formatDuration(service.duration_minutes))}</td>
            <td data-label="${escapeHtml(t("adminColVisible", "Visible"))}">
                <button type="button" class="badge-toggle ${service.is_active ? "on" : "off"}" data-action="toggle" data-id="${service.id}">
                    ${escapeHtml(service.is_active ? t("adminVisible", "Visible") : t("adminHidden", "Hidden"))}
                </button>
            </td>
            <td class="table-actions">
                <button type="button" class="button button-small" data-action="edit" data-id="${service.id}">${escapeHtml(t("adminEdit", "Edit"))}</button>
                <button type="button" class="button button-small button-danger" data-action="delete" data-id="${service.id}">${escapeHtml(t("adminDelete", "Delete"))}</button>
            </td>
        </tr>`).join("");

    servicesList.innerHTML = `
        <table class="admin-table">
            <thead><tr>
                <th>${escapeHtml(t("adminColName", "Service"))}</th>
                <th>${escapeHtml(t("adminColCategory", "Category"))}</th>
                <th>${escapeHtml(t("servicePrice", "Price"))}</th>
                <th>${escapeHtml(t("serviceDuration", "Estimated time"))}</th>
                <th>${escapeHtml(t("adminColVisible", "Visible"))}</th>
                <th><span class="visually-hidden">${escapeHtml(t("adminColActions", "Actions"))}</span></th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

servicesList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }
    const service = services.find((item) => item.id === Number(button.dataset.id));
    if (!service) {
        return;
    }

    if (button.dataset.action === "edit") {
        openServiceForm(service);
    } else if (button.dataset.action === "toggle") {
        setButtonLoading(button, true, "…");
        try {
            const updated = await updateService(service.id, { is_active: !service.is_active });
            services = services.map((item) => (item.id === updated.id ? updated : item));
            renderServices();
        } catch (error) {
            setButtonLoading(button, false);
            handleError(error);
        }
    } else if (button.dataset.action === "delete") {
        if (!window.confirm(t("adminConfirmDelete", "Delete this service? This cannot be undone."))) {
            return;
        }
        setButtonLoading(button, true, "…");
        try {
            await deleteService(service.id);
            services = services.filter((item) => item.id !== service.id);
            renderServices();
            showToast(t("adminDeleted", "Service deleted."));
        } catch (error) {
            setButtonLoading(button, false);
            handleError(error);
        }
    }
});

function openServiceForm(service = null) {
    editingId = service ? service.id : null;
    serviceForm.reset();
    clearFieldErrors(serviceForm);
    $("service-form-title").textContent = service ? t("adminEditService", "Edit service") : t("adminNewService", "New service");

    if (service) {
        Object.entries(serviceFields).forEach(([key, input]) => {
            if (input.type === "checkbox") {
                input.checked = Boolean(service[key]);
            } else {
                input.value = service[key] ?? "";
            }
        });
    } else {
        serviceFields.is_active.checked = true;
        serviceFields.sort_order.value = (services.length + 1) * 10;
    }
    serviceFormCard.hidden = false;
    serviceFields.name_en.focus();
}

function closeServiceForm() {
    serviceFormCard.hidden = true;
    editingId = null;
}

$("new-service-btn").addEventListener("click", () => openServiceForm());
$("service-cancel").addEventListener("click", closeServiceForm);

//Mirrors the CHECK constraints of the services table.
function validateService(values) {
    const errors = {};
    const between = (text, min, max) => text.length >= min && text.length <= max;
    if (!between(values.name_en, 2, 80)) errors.name_en = t("adminErrorName", "Between 2 and 80 characters.");
    if (!between(values.name_es, 2, 80)) errors.name_es = t("adminErrorName", "Between 2 and 80 characters.");
    if (!between(values.description_en, 10, 400)) errors.description_en = t("adminErrorDescription", "Between 10 and 400 characters.");
    if (!between(values.description_es, 10, 400)) errors.description_es = t("adminErrorDescription", "Between 10 and 400 characters.");
    if (!(values.price >= 0)) errors.price = t("adminErrorPrice", "Enter a price of 0 or more.");
    if (!(Number.isInteger(values.duration_minutes) && values.duration_minutes >= 5 && values.duration_minutes <= 1440)) {
        errors.duration_minutes = t("adminErrorDuration", "Enter whole minutes between 5 and 1440.");
    }
    if (!Number.isInteger(values.sort_order)) errors.sort_order = t("adminErrorSort", "Enter a whole number.");
    return errors;
}

function readServiceForm() {
    return {
        name_en: serviceFields.name_en.value.trim(),
        name_es: serviceFields.name_es.value.trim(),
        category: serviceFields.category.value,
        price: serviceFields.price.value === "" ? NaN : Number(serviceFields.price.value),
        duration_minutes: Number(serviceFields.duration_minutes.value),
        sort_order: Number(serviceFields.sort_order.value),
        description_en: serviceFields.description_en.value.trim(),
        description_es: serviceFields.description_es.value.trim(),
        is_active: serviceFields.is_active.checked,
    };
}

serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(serviceForm);
    const values = readServiceForm();
    const errors = validateService(values);
    Object.entries(errors).forEach(([key, message]) => setFieldError(serviceFields[key], message));
    if (Object.keys(errors).length) {
        serviceFields[Object.keys(errors)[0]].focus();
        return;
    }

    const button = serviceForm.querySelector("button[type='submit']");
    setButtonLoading(button, true, t("adminSaving", "Saving..."));
    try {
        if (editingId) {
            const updated = await updateService(editingId, values);
            services = services.map((item) => (item.id === updated.id ? updated : item));
        } else {
            services = [...services, await createService(values)];
        }
        services.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
        renderServices();
        closeServiceForm();
        showToast(t("adminSaved", "Service saved."));
    } catch (error) {
        handleError(error);
    } finally {
        setButtonLoading(button, false);
    }
});

//AI: writes both descriptions from the name, category, price and time.
$("ai-generate-btn").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const values = readServiceForm();
    const name = values.name_en || values.name_es;
    if (name.length < 2) {
        setFieldError(serviceFields.name_en, t("adminErrorNameFirst", "Write the service name first."));
        serviceFields.name_en.focus();
        return;
    }
    setButtonLoading(button, true, t("adminGenerating", "Generating..."));
    try {
        const result = await generateServiceDescriptions({
            name,
            category: values.category,
            price: Number.isNaN(values.price) ? 0 : values.price,
            durationMinutes: values.duration_minutes || 60,
        });
        serviceFields.description_en.value = result.description_en;
        serviceFields.description_es.value = result.description_es;
        setFieldError(serviceFields.description_en, "");
        setFieldError(serviceFields.description_es, "");
        showToast(t("adminGenerated", "Descriptions generated. Review them before saving."), "info");
    } catch (error) {
        showToast(errorMessage(error), "error");
    } finally {
        setButtonLoading(button, false);
    }
});

/* -------------------------------------------------------------- */
/* MESSAGES                                                       */
/* -------------------------------------------------------------- */

async function loadMessages() {
    messagesList.innerHTML = `<p class="state-box state-info"><span class="spinner" aria-hidden="true"></span>${escapeHtml(t("loading", "Loading..."))}</p>`;
    try {
        messages = await listMessages();
        renderMessages();
    } catch (error) {
        handleError(error, messagesList);
    }
}

function serviceName(id) {
    const service = services.find((item) => item.id === id);
    return service ? localized(service, "name") : t("contactServiceNone", "Not sure yet");
}

function renderMessages() {
    renderStats();
    const filter = messageFilter.value;
    const visible = filter === "all" ? messages : messages.filter((message) => message.status === filter);
    if (!visible.length) {
        renderState(messagesList, { type: "empty", message: t("adminNoMessages", "No messages here.") });
        return;
    }
    const statusOptions = (current) => Object.entries(STATUS_KEYS)
        .map(([value, key]) => `<option value="${value}"${value === current ? " selected" : ""}>${escapeHtml(t(key, value))}</option>`)
        .join("");

    messagesList.innerHTML = visible.map((message) => `
        <article class="card message-card status-${escapeHtml(message.status)}">
            <header class="message-header">
                <div>
                    <h3>${escapeHtml(message.name)}</h3>
                    <p class="message-meta">
                        <a href="mailto:${encodeURIComponent(message.email)}">${escapeHtml(message.email)}</a>
                        ${message.phone ? ` · ${escapeHtml(message.phone)}` : ""}
                        · ${escapeHtml(formatDate(message.created_at))}
                    </p>
                </div>
                <span class="service-category">${escapeHtml(serviceName(message.service_id))}</span>
            </header>
            <p class="message-body">${escapeHtml(message.message)}</p>
            <div class="message-actions">
                <label>
                    <span class="visually-hidden">${escapeHtml(t("adminStatus", "Status"))}</span>
                    <select data-action="status" data-id="${message.id}">${statusOptions(message.status)}</select>
                </label>
                <button type="button" class="button button-small button-danger" data-action="delete" data-id="${message.id}">${escapeHtml(t("adminDelete", "Delete"))}</button>
            </div>
        </article>`).join("");
}

messageFilter.addEventListener("change", renderMessages);

messagesList.addEventListener("change", async (event) => {
    const select = event.target.closest("select[data-action='status']");
    if (!select) {
        return;
    }
    const id = Number(select.dataset.id);
    select.disabled = true;
    try {
        await updateMessageStatus(id, select.value);
        messages = messages.map((message) => (message.id === id ? { ...message, status: select.value } : message));
        renderMessages();
        showToast(t("adminStatusSaved", "Status updated."));
    } catch (error) {
        select.disabled = false;
        handleError(error);
    }
});

messagesList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action='delete']");
    if (!button || !window.confirm(t("adminConfirmDeleteMessage", "Delete this message? This cannot be undone."))) {
        return;
    }
    const id = Number(button.dataset.id);
    setButtonLoading(button, true, "…");
    try {
        await deleteMessage(id);
        messages = messages.filter((message) => message.id !== id);
        renderMessages();
    } catch (error) {
        setButtonLoading(button, false);
        handleError(error);
    }
});

/* -------------------------------------------------------------- */
/* START                                                          */
/* -------------------------------------------------------------- */

onLanguageChange(() => {
    if (!panelSection.hidden) {
        renderServices();
        renderMessages();
    }
});

async function init() {
    if (!isSupabaseConfigured()) {
        showLogin(t("errorNotConfigured", "Supabase is not configured. Add your project URL and key in js/config.js."));
        return;
    }
    const session = await getSession();
    if (!session) {
        showLogin();
        return;
    }
    try {
        if (await isCurrentUserAdmin()) {
            await showPanel(session);
        } else {
            signOut();
            showLogin(t("loginNotAdmin", "This account does not have admin access."));
        }
    } catch (error) {
        handleError(error);
        showLogin(errorMessage(error));
    }
}

init();
