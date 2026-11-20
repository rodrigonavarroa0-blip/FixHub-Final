/* DASHBOARD - ADMIN */
/* Private panel: summary numbers, the service catalog (create, edit, hide, delete) and
   the contact messages. It owns the data; the child components only display it and
   call the functions they receive as props. */

import { useEffect, useState } from "react";
import {
    createService, deleteMessage, deleteService, listMessages, listServices, updateMessageStatus, updateService,
} from "../../services/supabase.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { errorMessage } from "../../utils/format.js";
import StateBox from "../../components/StateBox.jsx";
import ServiceForm from "./ServiceForm.jsx";
import ServicesTable from "./ServicesTable.jsx";
import MessagesList from "./MessagesList.jsx";

const byOrder = (a, b) => a.sort_order - b.sort_order || a.id - b.id;

export default function Dashboard({ session, onLogout, onSessionExpired }) {
    const { t } = useLanguage();
    const showToast = useToast();

    const [tab, setTab] = useState("services");
    const [services, setServices] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [editing, setEditing] = useState(undefined); //undefined = form closed, null = new service, object = editing
    const [busyId, setBusyId] = useState(null); //row that is waiting for the database

    //Any 401 (expired or invalid token) sends the admin back to the login form.
    function handleError(error) {
        if (error?.status === 401 || error?.code === "session_expired") {
            onSessionExpired();
            return;
        }
        showToast(errorMessage(error, t), "error");
    }

    async function loadData() {
        setLoading(true);
        setLoadError(null);
        try {
            //Both requests run at the same time.
            const [serviceRows, messageRows] = await Promise.all([listServices({ includeInactive: true }), listMessages()]);
            setServices(serviceRows);
            setMessages(messageRows);
        } catch (error) {
            if (error?.status === 401 || error?.code === "session_expired") {
                onSessionExpired();
                return;
            }
            setLoadError(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- SERVICES ---------- */

    async function saveService(values) {
        try {
            if (editing) {
                const updated = await updateService(editing.id, values);
                setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)).sort(byOrder));
            } else {
                const created = await createService(values);
                setServices((current) => [...current, created].sort(byOrder));
            }
            setEditing(undefined);
            showToast(t("adminSaved"));
        } catch (error) {
            handleError(error);
        }
    }

    async function toggleService(service) {
        setBusyId(`service-${service.id}`);
        try {
            const updated = await updateService(service.id, { is_active: !service.is_active });
            setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        } catch (error) {
            handleError(error);
        } finally {
            setBusyId(null);
        }
    }

    async function removeService(service) {
        if (!window.confirm(t("adminConfirmDelete"))) {
            return;
        }
        setBusyId(`service-${service.id}`);
        try {
            await deleteService(service.id);
            setServices((current) => current.filter((item) => item.id !== service.id));
            showToast(t("adminDeleted"));
        } catch (error) {
            handleError(error);
        } finally {
            setBusyId(null);
        }
    }

    /* ---------- MESSAGES ---------- */

    async function changeStatus(message, status) {
        setBusyId(`message-${message.id}`);
        try {
            await updateMessageStatus(message.id, status);
            setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, status } : item)));
            showToast(t("adminStatusSaved"));
        } catch (error) {
            handleError(error);
        } finally {
            setBusyId(null);
        }
    }

    async function removeMessage(message) {
        if (!window.confirm(t("adminConfirmDeleteMessage"))) {
            return;
        }
        setBusyId(`message-${message.id}`);
        try {
            await deleteMessage(message.id);
            setMessages((current) => current.filter((item) => item.id !== message.id));
        } catch (error) {
            handleError(error);
        } finally {
            setBusyId(null);
        }
    }

    /* ---------- STATS (derived from the data, recalculated on every render) ---------- */

    const stats = [
        { value: services.length, key: "adminStatServices" },
        { value: services.filter((service) => service.is_active).length, key: "adminStatActive" },
        { value: messages.filter((message) => message.status === "new").length, key: "adminStatNew", highlight: true },
    ];

    function renderTabContent() {
        if (loading) {
            return <StateBox loading message={t("loading")} />;
        }
        if (loadError) {
            return <StateBox type="error" message={errorMessage(loadError, t)} onRetry={loadData} />;
        }
        if (tab === "services") {
            return (
                <ServicesTable
                    services={services}
                    busyId={busyId}
                    onEdit={(service) => setEditing(service)}
                    onToggle={toggleService}
                    onDelete={removeService}
                />
            );
        }
        return (
            <MessagesList
                messages={messages}
                services={services}
                busyId={busyId}
                onStatusChange={changeStatus}
                onDelete={removeMessage}
            />
        );
    }

    return (
        <main className="content admin-panel">
            <div className="admin-topbar">
                <div>
                    <p className="tagline">{t("adminIntroTagline")}</p>
                    <h1>{t("adminPanelTitle")}</h1>
                    <p className="admin-user">{t("adminSignedInAs")} <strong>{session.email}</strong></p>
                </div>
                <button type="button" className="button button-outline" onClick={onLogout}>{t("navLogout")}</button>
            </div>

            {/* STATS */}
            <section className="stats-grid" aria-label="Summary">
                {stats.map((stat) => (
                    <div key={stat.key} className={`stat-card${stat.highlight ? " stat-highlight" : ""}`}>
                        <span className="stat-value">{loading ? "–" : stat.value}</span>
                        <span className="stat-label">{t(stat.key)}</span>
                    </div>
                ))}
            </section>

            {/* TABS */}
            <div className="tabs" role="tablist">
                <button type="button" role="tab" id="tab-btn-services" aria-controls="tab-services"
                    aria-selected={tab === "services"} onClick={() => setTab("services")}>
                    {t("adminTabServices")}
                </button>
                <button type="button" role="tab" id="tab-btn-messages" aria-controls="tab-messages"
                    aria-selected={tab === "messages"} onClick={() => setTab("messages")}>
                    {t("adminTabMessages")}
                </button>
            </div>

            <section id={`tab-${tab}`} role="tabpanel" aria-labelledby={`tab-btn-${tab}`}>
                {tab === "services" && (
                    <>
                        <div className="section-heading">
                            <h2>{t("adminServicesTitle")}</h2>
                            <button type="button" className="button button-primary" onClick={() => setEditing(null)}>
                                {t("adminNewService")}
                            </button>
                        </div>
                        {editing !== undefined && (
                            //key: a new form (with fresh state) for every service we open.
                            <ServiceForm
                                key={editing?.id ?? "new"}
                                service={editing}
                                nextSortOrder={(services.length + 1) * 10}
                                onSave={saveService}
                                onCancel={() => setEditing(undefined)}
                            />
                        )}
                    </>
                )}
                {renderTabContent()}
            </section>
        </main>
    );
}
