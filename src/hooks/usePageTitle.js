/* USE PAGE TITLE - CUSTOM HOOK */
/* Changes the browser tab title ("FixHub | Services") when a page is shown or the language changes. */

import { useEffect } from "react";

export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `FixHub | ${title}` : "FixHub | Computer Troubleshooting Platform";
    }, [title]);
}
