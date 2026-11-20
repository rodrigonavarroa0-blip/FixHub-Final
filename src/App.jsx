/* APP - ROUTES */
/* Every page of the site and its address. All pages share the <Layout> (header, footer, chat).
   HashRouter uses addresses like  .../#/services  because GitHub Pages only serves files:
   with the "#", the server always returns index.html and React shows the right page. */

import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import DiagnosePage from "./pages/DiagnosePage.jsx";
import GuidesPage from "./pages/GuidesPage.jsx";
import MaintenancePage from "./pages/MaintenancePage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="diagnose" element={<DiagnosePage />} />
                    <Route path="guides" element={<GuidesPage />} />
                    <Route path="maintenance" element={<MaintenancePage />} />
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}
