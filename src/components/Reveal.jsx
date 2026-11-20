/* REVEAL - COMPONENT */
/* Wraps any element and fades it in when it enters the screen (CSS classes .reveal / .is-visible).
   IntersectionObserver tells us when the element becomes visible without listening to every scroll.
   Usage: <Reveal as="article" className="card" index={2}>...</Reveal> */

import { useEffect, useRef, useState } from "react";

function skipAnimation() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window);
}

export default function Reveal({ as: Tag = "div", className = "", index = 0, children, ...props }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(skipAnimation);

    useEffect(() => {
        if (visible) {
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.12 });
        observer.observe(ref.current);
        //Cleanup: stop observing if the component disappears first.
        return () => observer.disconnect();
    }, [visible]);

    //Small stagger so cards in a grid appear one after another.
    const style = { transitionDelay: `${Math.min(index % 6, 5) * 60}ms` };

    return (
        <Tag ref={ref} className={`${className} reveal${visible ? " is-visible" : ""}`.trim()} style={style} {...props}>
            {children}
        </Tag>
    );
}
