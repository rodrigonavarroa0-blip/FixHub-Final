/* ADMIN PAGE */
/* Decides what to show: the login form or the private dashboard.
   On load it checks if there is a saved session AND if that user is in the "admins" table.
   The database also checks every action with Row Level Security, so hiding this page
   is not the only protection. */

import { useEffect, useState } from "react";
import { getSession, isCurrentUserAdmin, signOut } from "../../services/supabase.js";
import { isSupabaseConfigured } from "../../config.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { errorMessage } from "../../utils/format.js";
import StateBox from "../../components/StateBox.jsx";
import LoginForm from "./LoginForm.jsx";
import Dashboard from "./Dashboard.jsx";

export default function AdminPage() {
    const { t } = useLanguage();
    usePageTitle("Admin");

    //"checking" -> looking for a saved session, "login" -> show the form, "panel" -> show the dashboard.
    const [view, setView] = useState("checking");
    const [session, setSession] = useState(null);
    const [loginMessage, setLoginMessage] = useState("");

    function showLogin(message = "") {
        setSession(null);
        setLoginMessage(message);
        setView("login");
    }

    function showPanel(newSession) {
        setSession(newSession);
        setView("panel");
    }

    //Runs once: restore the session saved in localStorage (if it is still valid).
    useEffect(() => {
        async function init() {
            if (!isSupabaseConfigured()) {
                showLogin(t("errorNotConfigured"));
                return;
            }
            const saved = await getSession();
            if (!saved) {
                showLogin();
                return;
            }
            try {
                if (await isCurrentUserAdmin()) {
                    showPanel(saved);
                } else {
                    signOut();
                    showLogin(t("loginNotAdmin"));
                }
            } catch (error) {
                showLogin(errorMessage(error, t));
            }
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleLogout(message = t("logoutDone")) {
        signOut();
        showLogin(message);
    }

    if (view === "checking") {
        return (
            <main className="content">
                <StateBox loading message={t("loading")} />
            </main>
        );
    }

    if (view === "login") {
        return (
            <div className="auth-body">
                <LoginForm message={loginMessage} onSuccess={showPanel} onDenied={showLogin} />
            </div>
        );
    }

    return (
        <Dashboard
            session={session}
            onLogout={() => handleLogout()}
            onSessionExpired={() => handleLogout(t("errorSession"))}
        />
    );
}
