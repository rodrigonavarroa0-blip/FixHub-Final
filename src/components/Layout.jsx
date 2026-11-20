/* LAYOUT - COMPONENT */
/* Shared frame of every page: header, the current page (<Outlet />), footer and the FixBot chat. */

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import ChatWidget from "./ChatWidget.jsx";

export default function Layout() {
    const { pathname } = useLocation();

    //When the visitor changes page, start at the top like a normal website.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <>
            <Header />
            <Outlet />
            <Footer />
            <ChatWidget />
        </>
    );
}
