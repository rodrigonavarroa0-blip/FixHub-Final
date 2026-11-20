/* MAINTENANCE PAGE */
/* Preventive habits that keep a computer healthy.
   The cards come from src/data/pageContent.js and are drawn with the reusable InfoCard. */

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { MAINTENANCE_CARDS } from "../data/pageContent.js";
import PageHero from "../components/PageHero.jsx";
import InfoCard from "../components/InfoCard.jsx";

export default function MaintenancePage() {
    const { t } = useLanguage();
    usePageTitle(t("navMaintenance"));

    return (
        <main className="content">
            <PageHero variant="maintenance" taglineKey="MaintenanceHeroTagline" titleKey="MaintenanceHeroTitle" textKey="MaintenanceHeroDesc" />
            <section className="grid home">
                {MAINTENANCE_CARDS.map((card, index) => (
                    <InfoCard key={card.titleKey} index={index} {...card} />
                ))}
            </section>
        </main>
    );
}
