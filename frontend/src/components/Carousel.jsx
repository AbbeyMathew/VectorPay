import React, { useState, useEffect, useRef } from "react";
import "./Carousel.css";

export default function Carousel({ items, interval = 5000, speed = 500 }) {
    const [index, setIndex] = useState(0);
    const trackRef = useRef(null);

    useEffect(() => {
        const count = items.length;

        const slider = setInterval(() => {
            setIndex((prev) => (prev + 1) % count);
        }, interval);

        return () => clearInterval(slider);
    }, [items.length, interval]);

    return (
        <div className="step-carousel" onMouseEnter={() => (trackRef.current.style.animationPlayState = "paused")}
            onMouseLeave={() => (trackRef.current.style.animationPlayState = "running")}>

            <div className="step-track" ref={trackRef} style={{ transform: `translateX(-${index * 100}%)`, transition: `transform ${speed}ms ease`,}}>
                {items.map((item, i) => (
                    <div key={i} className="step-item">
                        {item}
                    </div>
                ))}
            </div>

        </div>
    );
}