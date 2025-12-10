import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./Heatmap.css";

function localDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function startOfMonth(year, month) {
    return new Date(year, month, 1, 0, 0, 0, 0);
}
function endOfMonth(year, month) {
    return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

export default function Heatmap({ endpoint = "/spend/daily", userId = null }) {
    const today = new Date();
    const [displayYear, setDisplayYear] = useState(today.getFullYear());
    const [displayMonth, setDisplayMonth] = useState(today.getMonth());
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [hover, setHover] = useState(null);
    const [maxVal, setMaxVal] = useState(0);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function loadMonth() {
            setLoading(true);
            setAuthError(false);
            setData({});
            setMaxVal(0);

            const start = startOfMonth(displayYear, displayMonth);
            const end = endOfMonth(displayYear, displayMonth);

            const startISO = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0).toISOString();
            const endISO = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString();

            const clientTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "+00:00";
            console.log("[Heatmap] clientTZ:", clientTZ);

            try {
                const res = await api.get(endpoint, {
                    params: {
                        start: startISO,
                        end: endISO,
                        tz: clientTZ,
                        ...(userId ? { userId } : {})
                    }
                });

                if (!mounted) return;

                const payload = res.data || {};
                const actualMap = payload && payload.map ? payload.map : payload;

                console.log("[Heatmap] fetched spend map:", actualMap);

                setData(actualMap);
                const max = Object.values(actualMap || {}).reduce((m, v) => (v > m ? v : m), 0);
                setMaxVal(max);
            } catch (err) {
                if (!mounted) return;
                if (err.response) {
                    const status = err.response.status;
                    if (status === 401 || status === 403) {
                        console.warn("Not authorized. Please login.");
                        setAuthError(true);
                        setData({});
                        setMaxVal(0);
                        setLoading(false);
                        return;
                    }
                    const txt = typeof err.response.data === "string" ? err.response.data.slice(0, 300) : JSON.stringify(err.response.data).slice(0, 300);
                    console.error("Server error while loading spend:", status, txt);
                } else {
                    console.error("Network/CORS error while loading spend:", err.message);
                }
                setData({});
                setMaxVal(0);
            } finally {
                mounted && setLoading(false);
            }
        }

        loadMonth();
        return () => (mounted = false);
    }, [displayYear, displayMonth, endpoint, userId]);

    function prevMonth() {
        if (displayMonth === 0) {
            setDisplayMonth(11);
            setDisplayYear(displayYear - 1);
        } else {
            setDisplayMonth(displayMonth - 1);
        }
    }
    function nextMonth() {
        if (displayMonth === 11) {
            setDisplayMonth(0);
            setDisplayYear(displayYear + 1);
        } else {
            setDisplayMonth(displayMonth + 1);
        }
    }

    const firstDay = startOfMonth(displayYear, displayMonth);
    const lastDay = endOfMonth(displayYear, displayMonth);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const thresholds = [0, maxVal * 0.05, maxVal * 0.2, maxVal * 0.5, maxVal];
    function colorClass(v) {
        if (!v || v <= 0) return "htm-color-0";
        if (v <= thresholds[1]) return "htm-color-1";
        if (v <= thresholds[2]) return "htm-color-2";
        if (v <= thresholds[3]) return "htm-color-3";
        return "htm-color-4";
    }

    if (authError) {
        return (
            <div className="htm-container">
                <div className="htm-header">
                    <div className="htm-title">
                        <strong>{firstDay.toLocaleString(undefined, { month: "long" })}</strong> {displayYear}
                    </div>
                </div>
                <div className="htm-auth-warning">Please sign in to view your spend heatmap.</div>
            </div>
        );
    }

    return (
        <div className="htm-container">
            <div className="htm-header">
                <button className="htm-arrow hoverable" onClick={prevMonth} aria-label="Previous month">◀</button>
                <div className="htm-title">
                    <strong>{firstDay.toLocaleString(undefined, { month: "long" })}</strong> {displayYear}
                </div>
                <button className="htm-arrow hoverable" onClick={nextMonth} aria-label="Next month">▶</button>
            </div>

            {loading ? (
                <div className="htm-loading">Loading month…</div>
            ) : (
                <>
                    <div className="htm-weekdays">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>

                    <div className="htm-grid">
                        {Array.from({ length: firstWeekday }).map((_, i) => (
                            <div key={`pad-${i}`} className="htm-cell htm-empty" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                            const day = idx + 1;
                            const d = new Date(displayYear, displayMonth, day);
                            const key = localDateKey(d);
                            const val = data[key] || 0;
                            const cls = colorClass(val);
                            const isFuture = d > new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            const finalClass = `htm-cell htm-day ${cls} ${isFuture ? "htm-future" : ""} ${val > 0 ? "has-value" : ""}`;

                            return (
                                <div
                                    key={key}
                                    className={finalClass}
                                    onMouseEnter={() => setHover({ key, val, isFuture })}
                                    onMouseLeave={() => setHover(null)}
                                    title={isFuture ? `${key} — Not arrived yet` : `${key} — $${val.toFixed(2)}`}
                                >
                                    <div className="htm-day-num">{day}</div>
                                </div>
                            );
                        })}

                        {(() => {
                            const totalCells = firstWeekday + daysInMonth;
                            const trailing = (7 - (totalCells % 7)) % 7;
                            return Array.from({ length: trailing }).map((_, i) => (
                                <div key={`trail-${i}`} className="htm-cell htm-empty" />
                            ));
                        })()}
                    </div>

                    <div className="htm-footer">
                        <div className="htm-legend">
                            <span>Less</span>
                            <div className="htm-box htm-color-0" />
                            <div className="htm-box htm-color-1" />
                            <div className="htm-box htm-color-2" />
                            <div className="htm-box htm-color-3" />
                            <div className="htm-box htm-color-4" />
                            <span>More</span>
                        </div>

                        <div className="htm-tooltip-area">
                            {hover ? (
                                hover.isFuture ? (
                                    <div className="htm-tooltip">
                                        <div><strong>{hover.key}</strong></div>
                                        <div>This day hasn't arrived yet</div>
                                    </div>
                                ) : (
                                    <div className="htm-tooltip">
                                        <div><strong>{hover.key}</strong></div>
                                        <div>Spent: ₹{hover.val.toFixed(2)}</div>
                                    </div>
                                )
                            ) : (
                                <div className="htm-muted">Hover a day to see spend</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
