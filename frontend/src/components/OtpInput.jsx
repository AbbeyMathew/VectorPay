import React, { useRef, useEffect } from "react";

export default function OtpInput({ length = 6, value = "", onChange, autoFocus = true }) {
    const inputsRef = useRef([]);

    useEffect(() => {
        if (autoFocus && inputsRef.current[0]) inputsRef.current[0].focus();
    }, [autoFocus]);

    const padded = (value || "").slice(0, length).padEnd(length, "");

    const handlePaste = (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData("text");
        const digits = paste.replace(/\D/g, "").slice(0, length);
        if (!digits) return;
        onChange(digits);
        const lastIndex = Math.min(digits.length - 1, length - 1);
        inputsRef.current[lastIndex]?.focus();
    };

    const onKeyDown = (e, idx) => {
        const key = e.key;
        const cur = inputsRef.current[idx];
        if (key === "Backspace") {
            e.preventDefault();
            if (padded[idx]) {
                const next = padded.split("");
                next[idx] = "";
                onChange(next.join("").trim());
                cur.value = "";
            } else if (idx > 0) {
                inputsRef.current[idx - 1].focus();
                const next = padded.split("");
                next[idx - 1] = "";
                onChange(next.join("").trim());
            }
        } else if (key === "ArrowLeft" && idx > 0) {
            e.preventDefault();
            inputsRef.current[idx - 1].focus();
        } else if (key === "ArrowRight" && idx < length - 1) {
            e.preventDefault();
            inputsRef.current[idx + 1].focus();
        } else if (key === "Enter") {
            //pass
        } else if (!/^[0-9]$/.test(key) && key.length === 1) {
            e.preventDefault();
        }
    };

    const onInput = (e, idx) => {
        const ch = e.target.value.replace(/\D/g, "").slice(-1);
        const arr = padded.split("");
        arr[idx] = ch || "";
        const newValue = arr.join("").replace(/\s/g, "");
        onChange(newValue.trim());
        if (ch && idx < length - 1) {
            inputsRef.current[idx + 1].focus();
        }
    };

    return (
        <div
            onPaste={handlePaste}
            style={{ display: "flex", gap: 8, justifyContent: "flex-start", alignItems: "center" }}
            aria-label={`Enter ${length}-digit code`}
        >
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={padded[i] || ""}
                    onChange={(e) => onInput(e, i)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    style={{
                        width: 44,
                        height: 52,
                        fontSize: 20,
                        textAlign: "center",
                        borderRadius: 8,
                        fontFamily: 'Montserrat, sans-serif',
                        cursor: 'none',
                        border: "1px solid rgba(0,0,0,0.12)",
                        outline: "none",
                        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.02)",
                    }}
                    aria-label={`Digit ${i + 1}`}
                />
            ))}
        </div>
    );
}
