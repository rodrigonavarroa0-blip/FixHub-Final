/* DIAGNOSE PAGE */
/* Common computer problems with a possible cause and what to try.
   The cards come from src/data/pageContent.js and are drawn with the reusable InfoCard. */

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { DIAGNOSE_CARDS } from "../data/pageContent.js";
import PageHero from "../components/PageHero.jsx";
import InfoCard from "../components/InfoCard.jsx";

export default function DiagnosePage() {
    const { t } = useLanguage();
    usePageTitle(t("navDiagnose"));

    return (
        <main className="content">
            <PageHero variant="diagnose" taglineKey="heroDiagnoseTagline" titleKey="heroDiagnoseSubTitle" textKey="heroDiagnoseText" />
            <section className="grid diag">
                {DIAGNOSE_CARDS.map((card, index) => (
                    <InfoCard key={card.titleKey} index={index} {...card} />
                ))}
            </section>
        </main>
    );
}
