import React from "react";
import "./Avatar.css";

function stringToColor(str = "") {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 55%)`;
}

export default function Avatar({ name = "", size = 40 }) {
    const first = (name?.trim()?.charAt(0) || "?").toUpperCase();
    const bg = stringToColor(name || "anon");

    return (
        <div
            className="avatar-circle"
            style={{
                width: size,
                height: size,
                fontSize: Math.max(12, Math.floor(size * 0.45)),
                backgroundColor: bg,
            }}
            title={name || "system"}
            aria-hidden="false"
        >
            {first}
        </div>
    );
}
