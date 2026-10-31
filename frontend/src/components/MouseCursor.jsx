import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function MouseCursor() {
    const bigRef = useRef(null);
    const smallRef = useRef(null);

    useEffect(() => {
        const big = bigRef.current;
        const small = smallRef.current;
        if (!big || !small) return;

        const moveHandler = (e) => {
            gsap.to(big, {
                x: e.clientX - 15,
                y: e.clientY - 7.5,
                duration: 0.4,
                ease: "power2.out",
            });

            gsap.to(small, {
                x: e.clientX - 5,
                y: e.clientY - 5,
                duration: 0.08,
                ease: "power1.out",
            });
        };

        const resetOnClick = () => {
            gsap.to(big, { scale: 1, duration: 0.18, ease: "power2.out" });
        };

        document.addEventListener('click', resetOnClick, { passive: true });
        document.addEventListener("mousemove", moveHandler);

        const hoverHandler = (e) => {
            if (e.target.closest(".hoverable")) {
                gsap.to(big, { scale: 4, duration: 0.3, ease: "power2.out" });
            }
        };

        const hoverOutHandler = (e) => {
            if (e.target.closest(".hoverable")) {
                gsap.to(big, { scale: 1, duration: 0.3, ease: "power2.out" });
            }
        };

        document.addEventListener("mouseover", hoverHandler);
        document.addEventListener("mouseout", hoverOutHandler);

        return () => {
            document.removeEventListener('click', resetOnClick);
            document.removeEventListener("mousemove", moveHandler);
            document.removeEventListener("mouseover", hoverHandler);
            document.removeEventListener("mouseout", hoverOutHandler);
        };
    }, []);

    return (
        <div className="cursor">
            <div ref={bigRef} className="cursor__ball cursor__ball--big">
                <svg width="30" height="30">
                    <circle cx="15" cy="15" r="12"></circle>
                </svg>
            </div>
            <div ref={smallRef} className="cursor__ball cursor__ball--small">
                <svg width="10" height="10">
                    <circle cx="5" cy="5" r="4"></circle>
                </svg>
            </div>
        </div>
    );
}
