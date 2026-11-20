/* GUIDES PAGE */
/* Step-by-step guides for common Windows blue screen errors.
   The cards come from src/data/pageContent.js and are drawn with the reusable InfoCard. */

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { GUIDE_CARDS } from "../data/pageContent.js";
import PageHero from "../components/PageHero.jsx";
import InfoCard from "../components/InfoCard.jsx";

export default function GuidesPage() {
    const { t } = useLanguage();
    usePageTitle(t("navGuides"));

    return (
        <main className="content">
            <PageHero variant="guides" taglineKey="heroRepairTagline" titleKey="heroRepairTitle" textKey="heroRepairDesc" />
            <section className="grid guides">
                {GUIDE_CARDS.map((card, index) => (
                    <InfoCard key={card.titleKey} index={index} {...card} />
                ))}
            </section>
        </main>
    );
}
