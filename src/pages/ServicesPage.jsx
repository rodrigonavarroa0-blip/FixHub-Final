/* SERVICES PAGE */
/* The catalog: loads the services from Supabase and lets visitors filter them by category.
   Shows skeleton cards while loading, an error with "Try again", or an empty message. */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import { useServices } from "../hooks/useServices.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { CATEGORIES } from "../utils/categories.js";
import { errorMessage } from "../utils/format.js";
import PageHero from "../components/PageHero.jsx";
import Reveal from "../components/Reveal.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import SkeletonCards from "../components/SkeletonCards.jsx";
import StateBox from "../components/StateBox.jsx";

const FILTERS = [{ value: "all", key: "categoryAll" }, ...CATEGORIES];

export default function ServicesPage() {
    const { t } = useLanguage();
    const { openChat } = useChat();
    const { services, loading, error, reload } = useServices();
    const [activeCategory, setActiveCategory] = useState("all");
    usePageTitle(t("navServices"));

    //Derived data: React recalculates it on every render, no extra state needed.
    const visible = activeCategory === "all" ? services : services.filter((service) => service.category === activeCategory);

    function renderGrid() {
        if (loading) {
            return <SkeletonCards count={6} />;
        }
        if (error) {
            return <StateBox type="error" title={t("servicesErrorTitle")} message={errorMessage(error, t)} onRetry={reload} />;
        }
        if (!visible.length) {
            return <StateBox type="empty" message={t("servicesEmpty")} />;
        }
        return visible.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />);
    }

    return (
        <main className="content">
            <PageHero variant="services" taglineKey="servicesTagline" titleKey="servicesTitle" textKey="servicesDesc" />

            {/* CATEGORY FILTERS */}
            <div className="filter-bar" role="group" aria-label={t("servicesFilterLabel")}>
                {FILTERS.map((filter) => (
                    <button
                        key={filter.value}
                        type="button"
                        className="chip"
                        aria-pressed={activeCategory === filter.value}
                        onClick={() => setActiveCategory(filter.value)}
                    >
                        {t(filter.key)}
                    </button>
                ))}
            </div>

            {/* SERVICES GRID */}
            <section className="grid services-grid" aria-live="polite" aria-busy={loading} aria-label={t("servicesTagline")}>
                {renderGrid()}
            </section>

            {/* HELP PANEL */}
            <Reveal as="section" className="intro-panel">
                <div>
                    <p className="tagline">{t("servicesHelpTagline")}</p>
                    <h2>{t("servicesHelpTitle")}</h2>
                </div>
                <div>
                    <p>{t("servicesHelpDesc")}</p>
                    <div className="actions">
                        <button type="button" className="button button-primary" onClick={openChat}>{t("aiBannerButton")}</button>
                        <Link className="button button-outline" to="/contact">{t("navContact")}</Link>
                    </div>
                </div>
            </Reveal>
        </main>
    );
}
