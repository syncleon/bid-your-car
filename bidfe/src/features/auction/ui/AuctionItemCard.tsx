import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { AuctionDto } from "../types";

interface Props {
    auction: AuctionDto;
}

export const AuctionCard = ({ auction }: Props) => {
    const { item, currentHighestBid, startPrice, endTime, bidCount } = auction;

    // 1. State for real-time countdown
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        // Tick every second to show seconds counting down
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    // 2. Calculate Time Remaining
    const endDate = new Date(endTime);
    const timeRemaining = endDate.getTime() - now;
    const isEnded = timeRemaining <= 0;

    // Urgent if less than 1 hour remains
    const isUrgent = timeRemaining > 0 && timeRemaining < 60 * 60 * 1000;

    // 3. Format Timer String (Smart Format)
    let timerText = "Ended";
    if (!isEnded) {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        if (days > 0) {
            timerText = `${days}d ${hours}h`;
        } else if (hours > 0) {
            timerText = `${hours}h ${minutes}m`;
        } else {
            timerText = `${minutes}m ${seconds}s`;
        }
    }

    // 4. Display Logic
    const price = currentHighestBid ?? startPrice;
    const mainImage = item.images?.[0]?.thumbnailUrl;

    return (
        <Link to={`/auctions/${auction.id}`} style={linkStyle}>
            <div style={containerStyle}>

                {/* --- Image Section --- */}
                <div style={imageWrapperStyle}>
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={item.model}
                            style={imageStyle}
                            loading="lazy"
                        />
                    ) : (
                        <div style={placeholderStyle}>No Photos</div>
                    )}

                    {/* Top Left: LIVE Status */}
                    <div style={statusBadgeStyle}>
                        <span style={dotStyle} />
                        LIVE
                    </div>

                    {/* Bottom Left: COUNTDOWN TIMER (Balloon) */}
                    <div style={{
                        ...timerBadgeStyle,
                        background: isUrgent ? "#dc2626" : "rgba(255, 255, 255, 0.95)",
                        color: isUrgent ? "#fff" : "#111",
                        border: isUrgent ? "none" : "1px solid rgba(0,0,0,0.1)"
                    }}>
                        {/* Clock Icon */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {timerText}
                    </div>

                    {/* Bottom Right: Bid Count */}
                    <div style={bidCountStyle}>
                        {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
                    </div>
                </div>

                {/* --- Details Section --- */}
                <div style={contentStyle}>
                    <h3 style={titleStyle}>
                        <span style={yearStyle}>{item.year}</span> {item.make} {item.model}
                    </h3>

                    <div style={metaGridStyle}>
                        <div>
                            <div style={labelStyle}>CURRENT BID</div>
                            <div style={priceStyle}>
                                ${price.toLocaleString()}
                            </div>
                        </div>

                        {/* We removed the old timer from here since it's now on the image.
                            Instead, we can show the absolute end date or just the location. */}
                        <div style={{ textAlign: "right" }}>
                            <div style={labelStyle}>LOCATION</div>
                            <div style={locationStyle}>{item.location}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// --- Styles ---

const timerBadgeStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "10px",
    left: "10px", // Bottom Left corner
    padding: "4px 8px",
    borderRadius: "20px", // Rounded "Balloon" shape
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    fontVariantNumeric: "tabular-nums",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 2,
    transition: "background 0.3s, color 0.3s"
};

// ... existing styles ...
const linkStyle: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "block" };
const containerStyle: React.CSSProperties = { background: "#fff", borderRadius: "8px", overflow: "hidden", cursor: "pointer", border: "1px solid transparent", transition: "transform 0.2s, box-shadow 0.2s" };
const imageWrapperStyle: React.CSSProperties = { aspectRatio: "16/10", width: "100%", background: "#f3f4f6", position: "relative", overflow: "hidden" };
const imageStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" };
const placeholderStyle: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "12px", textTransform: "uppercase" };
const statusBadgeStyle: React.CSSProperties = { position: "absolute", top: "10px", left: "10px", background: "rgba(0, 0, 0, 0.8)", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" };
const dotStyle: React.CSSProperties = { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ef4444", display: "block" };
const bidCountStyle: React.CSSProperties = { position: "absolute", bottom: "10px", right: "10px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, backdropFilter: "blur(4px)" };
const contentStyle: React.CSSProperties = { padding: "16px 0 0 0" };
const titleStyle: React.CSSProperties = { margin: "0 0 12px 0", fontSize: "18px", fontWeight: 600, color: "#111", lineHeight: 1.3 };
const yearStyle: React.CSSProperties = { fontWeight: 400, color: "#6b7280" };
const metaGridStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" };
const labelStyle: React.CSSProperties = { fontSize: "10px", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "4px", textTransform: "uppercase" };
const priceStyle: React.CSSProperties = { fontSize: "18px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" };
const locationStyle: React.CSSProperties = { fontSize: "13px", fontWeight: 500, color: "#444" };