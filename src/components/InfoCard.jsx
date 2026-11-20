/* INFO CARD - COMPONENT */
/* Card used by the Diagnose, Guides and Maintenance pages. All texts are translation keys,
   so the same component shows the content in English or Spanish. */

import { useLanguage } from "../i18n/LanguageContext.jsx";
import Reveal from "./Reveal.jsx";

export default function InfoCard({ titleKey, badgeKey, textKeys = [], stepKeys = [], index }) {
    const { t } = useLanguage();
    return (
        <Reveal as="article" className="card" index={index}>
            <h3>{t(titleKey)}</h3>
            {badgeKey && <p className="code-badge">{t(badgeKey)}</p>}
            {textKeys.map((key) => <p key={key}>{t(key)}</p>)}
            {stepKeys.length > 0 && (
                <ul>
                    {stepKeys.map((key) => <li key={key}>{t(key)}</li>)}
                </ul>
            )}
        </Reveal>
    );
}
