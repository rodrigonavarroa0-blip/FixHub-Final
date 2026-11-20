/* HOME PAGE */
/* Brand hero, the four sections of the site, the first services of the catalog
   (loaded from Supabase) and the call to action for FixBot. */

import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import { useServices } from "../hooks/useServices.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import Reveal from "../components/Reveal.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import SkeletonCards from "../components/SkeletonCards.jsx";

const FEATURED_COUNT = 3;

//The four feature cards: translation key prefix and route.
const FEATURES = [
    { id: "diagnose", prefix: "cardDiagnose", to: "/diagnose" },
    { id: "guides", prefix: "cardGuides", to: "/guides" },
    { id: "maintenance", prefix: "cardMaintenance", to: "/maintenance" },
    { id: "services", prefix: "cardServices", to: "/services" },
];

export default function HomePage() {
    const { t } = useLanguage();
    const { openChat } = useChat();
    const { services, loading, error } = useServices();
    usePageTitle(null);

    const featured = services.slice(0, FEATURED_COUNT);
    //If the catalog cannot be loaded, the section is hidden so the home page still looks complete.
    const showFeatured = loading || (!error && featured.length > 0);

    return (
        <>
            {/* HERO */}
            <section className="hero-index">
                <div className="hero-index-container">
                    <div className="hero-index-content">
                        <p className="tagline">{t("title")}</p>
                        <h1>{t("aftitle1")}</h1>
                        <p>{t("aftitle2")}</p>
                        <div className="hero-actions">
                            <Link className="button button-primary" to="/diagnose">{t("startDiagnosis")}</Link>
                            <Link className="button button-secondary" to="/guides">{t("exploreGuides")}</Link>
                        </div>
                    </div>
                </div>
            </section>

            <main>
                {/* FEATURE CARDS */}
                <section className="grid home" aria-label="Platform features">
                    {FEATURES.map((feature, index) => (
                        <Reveal as="article" className="card" id={feature.id} key={feature.id} index={index}>
                            <h3>{t(`${feature.prefix}Title`)}</h3>
                            <p>{t(`${feature.prefix}Desc`)}</p>
                            <Link className="link" to={feature.to}>{t(`${feature.prefix}Link`)}</Link>
                        </Reveal>
                    ))}
                </section>

                {/* FEATURED SERVICES (from Supabase) */}
                {showFeatured && (
                    <section className="featured-services" aria-labelledby="featured-title">
                        <div className="section-heading">
                            <div>
                                <p className="tagline">{t("featuredTagline")}</p>
                                <h2 id="featured-title">{t("featuredTitle")}</h2>
                            </div>
                            <Link className="link" to="/services">{t("featuredLink")}</Link>
                        </div>
                        <div className="grid services-grid" aria-busy={loading}>
                            {loading
                                ? <SkeletonCards count={FEATURED_COUNT} />
                                : featured.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}
                        </div>
                    </section>
                )}

                {/* AI CALL TO ACTION */}
                <Reveal as="section" className="ai-banner" aria-labelledby="ai-banner-title">
                    <div>
                        <p className="tagline">{t("aiBannerTagline")}</p>
                        <h2 id="ai-banner-title">{t("aiBannerTitle")}</h2>
                        <p>{t("aiBannerDesc")}</p>
                    </div>
                    <button type="button" className="button button-primary" onClick={openChat}>{t("aiBannerButton")}</button>
                </Reveal>

                {/* WHY USERS LIKE FIXHUB */}
                <Reveal as="section" className="intro-panel">
                    <div>
                        <p className="tagline">{t("whyUserLikeTitle")}</p>
                        <h2>{t("whyUserLikeH2")}</h2>
                    </div>
                    <p>{t("whyUserLikeP")}</p>
                </Reveal>
            </main>
        </>
    );
}
