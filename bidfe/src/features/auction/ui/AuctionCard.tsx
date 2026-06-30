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

            if (days >= 7) {
                const weeks = Math.floor(days / 7);
                setTimeLeft(`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`);
                setIsUrgent(false);
            } else if (days >= 1) {
                setTimeLeft(`${days} ${days === 1 ? 'day' : 'days'}`);
                setIsUrgent(false);
            } else {
                const h = String(hours).padStart(2, '0');
                const m = String(minutes).padStart(2, '0');
                const s = String(seconds).padStart(2, '0');
                setTimeLeft(`${h}:${m}:${s}`);
                setIsUrgent(hours < 1 && days === 0);
            }
        };

        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return { timeLeft, isEnded, isUrgent };
};


const formatPrice = (p: number) => `$${p.toLocaleString()}`;




export const AuctionCard = ({ auction, viewMode = "grid" }: Props) => {
    const { item, currentPrice, endTime, status, isNoReserve } = auction;
    const { timeLeft, isEnded, isUrgent } = useAuctionTimer(endTime);

    const firstImage = item.images?.[0];
    const mainImage = firstImage ? firstImage.url : item.thumbnailUrl;

    const isActive = status === 'ACTIVE';
    const isPending = status === 'PENDING_APPROVAL';
    const isSold = status === 'SOLD';

    
    const timerBadgeStyle: React.CSSProperties = {
        ...styles.badgeTimer,
        backgroundColor: isUrgent ? "rgba(239, 68, 68, 0.9)" : "rgba(17,17,17,0.75)",
        backdropFilter: "blur(6px)",
        color: "#fff",
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        fontSize: "13px",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "14px",
        border: isUrgent ? "1px solid rgba(255,255,255,0.3)" : "none",
        whiteSpace: "nowrap",
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



                bottomLeft: (
                    <>
                        {isActive && !isEnded && timeLeft && (
                            <div style={timerBadgeStyle} className={isUrgent ? "urgent-timer-anim" : ""}>
                                {isUrgent ? <UrgentDot /> : <ClockIcon />}
                                <span>{timeLeft}</span>
                                <span style={{ opacity: 0.5, fontWeight: 300, margin: "0 2px" }}>·</span>
                                <span>Bid: {formatPrice(currentPrice)}</span>
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
            <div className="auction-card-body">
                <div className="auction-card-subtitle">
                    {[
                        item.engine,
                        item.transmission,
                        item.drivetrain,
                        item.fuelType,
                        item.exteriorColor
                    ].filter(Boolean).join(", ")}
                </div>

                <div className="auction-card-location-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.location}</span>
                </div>
            </div>
        </BaseCard>
    );
};


const ClockIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const UrgentDot = () => (
    <span className="urgent-dot" />
);
