/* PAGE HERO - COMPONENT */
/* Banner at the top of the inner pages. `variant` picks the background photo in the CSS
   (hero-diagnose, hero-guides, hero-maintenance, hero-services, hero-support). */

import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function PageHero({ variant, taglineKey, titleKey, textKey }) {
    const { t } = useLanguage();
    return (
        <section className={`hero hero-${variant}`}>
            <div className="hero-content">
                <p className="tagline">{t(taglineKey)}</p>
                <h1>{t(titleKey)}</h1>
                <p>{t(textKey)}</p>
            </div>
        </section>
    );
}
