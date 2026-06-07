import { useState, useEffect } from "react";
import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import styles from "../../../widgets/BaseCard/styles";
import type { AuctionDto } from "../types";
import "./AuctionCard.css";

interface Props {
    auction: AuctionDto;
    viewMode?: "grid" | "list";
}

const useAuctionTimer = (endTime: string) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isEnded, setIsEnded] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculate = () => {
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setIsEnded(true);
                setTimeLeft("Ended");
                setIsUrgent(false);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
                setIsUrgent(false);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
                setIsUrgent(hours < 1);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
                setIsUrgent(true);
            } else {
                setTimeLeft(`${seconds}s`);
                setIsUrgent(true);
            }
        };

        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return { timeLeft, isEnded, isUrgent };
};

// ── Helper formatters ────────────────────────────────────────
const formatMileage = (m: number) =>
    m >= 1000 ? `${Math.round(m / 1000 * 10) / 10}k mi` : `${m} mi`;

const formatPrice = (p: number) =>
    p >= 1000 ? `$${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}k` : `$${p}`;

// ── Spec pill ────────────────────────────────────────────────
const Pill = ({ children }: { children: React.ReactNode }) => (
    <span className="auction-card-pill">{children}</span>
);

// ── Main component ────────────────────────────────────────────
export const AuctionCard = ({ auction, viewMode = "grid" }: Props) => {
    const { item, currentPrice, endTime, status, bidCount, isNoReserve } = auction;
    const { timeLeft, isEnded, isUrgent } = useAuctionTimer(endTime);

    const firstImage = item.images?.[0];
    const mainImage = firstImage ? firstImage.url : item.thumbnailUrl;

    const isActive = status === 'ACTIVE';
    const isPending = status === 'PENDING_APPROVAL';
    const isSold = status === 'SOLD';
    const isHot = bidCount >= 10;

    // ── Timer badge (bottom-left overlay) ─────────────────────
    const timerBadgeStyle: React.CSSProperties = {
        ...styles.badgeTimer,
        backgroundColor: isUrgent ? "rgba(239, 68, 68, 0.9)" : "rgba(17,17,17,0.75)",
        backdropFilter: "blur(6px)",
        color: "#fff",
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        fontSize: "12px",
        padding: "5px 10px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "20px",
        border: isUrgent ? "1px solid rgba(255,255,255,0.3)" : "none",
    };

    const soldBadgeStyle: React.CSSProperties = {
        ...timerBadgeStyle,
        backgroundColor: "rgba(17,17,17,0.75)",
    };

    return (
        <BaseCard
            to={`/auctions/${auction.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            isUrgent={isUrgent && isActive && !isEnded}
            viewMode={viewMode}
            overlays={{
                topLeft: (
                    <>
                        {isPending && (
                            <div style={{ ...styles.badge, background: "#f59e0b", color: "#fff" }}>
                                PENDING
                            </div>
                        )}
                        {isSold && (
                            <div style={{ ...styles.badge, background: "rgba(239,68,68,0.85)", color: "#fff" }}>
                                SOLD
                            </div>
                        )}
                        {!isSold && !isPending && isEnded && (
                            <div style={styles.badgeEnded}>ENDED</div>
                        )}
                        {isNoReserve && !isSold && !isEnded && (
                            <div className="badge-no-reserve">No Reserve</div>
                        )}
                    </>
                ),

                topRight: (
                    <>
                        {isHot && isActive && !isEnded && (
                            <div className="badge-hot">🔥 {bidCount}</div>
                        )}
                    </>
                ),

                bottomLeft: (
                    <>
                        {isActive && !isEnded && timeLeft && (
                            <div style={timerBadgeStyle}>
                                {isUrgent ? <UrgentDot /> : <ClockIcon />}
                                <span>{timeLeft}</span>
                                <span style={{ opacity: 0.5, fontWeight: 300, margin: "0 2px" }}>·</span>
                                <span>{formatPrice(currentPrice)}</span>
                            </div>
                        )}
                        {isSold && (
                            <div style={soldBadgeStyle}>
                                <span style={{ fontSize: "10px", opacity: 0.7 }}>Sold</span>
                                <span>${currentPrice.toLocaleString()}</span>
                            </div>
                        )}
                        {!isSold && isEnded && !isPending && (
                            <div style={timerBadgeStyle}>
                                <span style={{ fontSize: "10px", opacity: 0.7 }}>Final</span>
                                <span>${currentPrice.toLocaleString()}</span>
                            </div>
                        )}
                    </>
                ),
            }}
        >
            {/* ── Card body below image ────────────────────────── */}
            <div className="auction-card-body">
                {/* Specs row: mileage + transmission */}
                <div className="auction-card-specs">
                    {item.mileage != null && (
                        <Pill>{formatMileage(item.mileage)}</Pill>
                    )}
                    {item.transmission && (
                        <Pill>{item.transmission}</Pill>
                    )}
                    {item.fuelType && (
                        <Pill>{item.fuelType}</Pill>
                    )}
                </div>

                {/* Footer: location + bid count */}
                <div className="auction-card-footer">
                    <div className="auction-card-location">
                        <LocationIcon />
                        <span>{item.location}</span>
                    </div>
                    {!isSold && bidCount > 0 && (
                        <div className={`auction-card-bids${isHot ? " auction-card-bids--hot" : ""}`}>
                            <span>{bidCount}</span>
                            <span style={{ opacity: 0.6 }}>{bidCount === 1 ? "bid" : "bids"}</span>
                        </div>
                    )}
                    {isActive && bidCount === 0 && (
                        <div className="auction-card-bids auction-card-bids--none">
                            No bids yet
                        </div>
                    )}
                </div>
            </div>
        </BaseCard>
    );
};

// ── Icons & micro-components ────────────────────────────────
const ClockIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const UrgentDot = () => (
    <span className="urgent-dot" />
);

const LocationIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);