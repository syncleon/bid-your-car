import { useState, useEffect } from "react";
import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import styles from "../../../widgets/BaseCard/styles";
import type { AuctionDto } from "../types";

interface Props {
    auction: AuctionDto;
}

// Reusable Hook for Countdown Logic
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
                setTimeLeft(`${days} ${days === 1 ? "Day" : "Days"}`);
                setIsUrgent(false);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
                setIsUrgent(false);
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

export const AuctionCard = ({ auction }: Props) => {
    const { item, currentHighestBid, startPrice, endTime, status } = auction;
    const { timeLeft, isEnded } = useAuctionTimer(endTime);

    const price = currentHighestBid ?? startPrice;

    const firstImage = item.images?.[0];
    const mainImage = firstImage
        ? (firstImage.previewUrl || firstImage.url || firstImage.thumbnailUrl)
        : null;

    // --- Улучшенные флаги статусов ---
    const isActive = status === 'ACTIVE';
    const isPending = status === 'PENDING_APPROVAL';
    const isSold = status === 'SOLD'; // Новый статус для проданных авто

    // --- Dynamic Styles ---
    const timerStyle = {
        ...styles.badgeTimer,
        backgroundColor: "rgba(17, 17, 17, 0.7)",
        backdropFilter: "blur(4px)",
        color: "#fff",
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums" as const,
        fontSize: "12px",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "fit-content"
    };

    const soldPriceStyle = {
        ...timerStyle,
        backgroundColor: "rgba(17, 17, 17, 0.7)",
    };

    return (
        <BaseCard
            to={`/auctions/${auction.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                // 1. Status Badge (Верхний левый угол)
                topLeft: (
                    <>
                        {isPending && (
                            <div style={{...styles.badge, background: "#f59e0b", color: "#fff"}}>
                                PENDING
                            </div>
                        )}
                        {isSold && (
                            <div style={{...styles.badge, background: "rgba(250,0,0,0.7)", color: "#fff"}}>
                                SOLD
                            </div>
                        )}
                        {/* Показываем ENDED только если статус не SOLD и не PENDING */}
                        {!isSold && !isPending && isEnded && (
                            <div style={styles.badgeEnded}>ENDED</div>
                        )}
                    </>
                ),

                // 2. Info Badge (Нижний левый угол)
                bottomLeft: (
                    <>
                        {/* Активный аукцион: Таймер + Ставка */}
                        {isActive && !isEnded && timeLeft && (
                            <div style={timerStyle}>
                                <ClockIcon />
                                <span>{timeLeft}</span>
                                <span style={{opacity: 0.8, fontWeight: 300}}>|</span>
                                <span>Bid ${price.toLocaleString()}</span>
                            </div>
                        )}

                        {/* Проданный автомобиль: Финальная цена */}
                        {isSold && (
                            <div style={soldPriceStyle}>
                                <span style={{fontSize: '10px', opacity: 0.8}}>Sold for</span>
                                <span>${price.toLocaleString()}</span>
                            </div>
                        )}

                        {!isSold && isEnded && !isPending && (
                            <div style={timerStyle}>
                                <span>Final Bid: ${price.toLocaleString()}</span>
                            </div>
                        )}
                    </>
                )
            }}
        >
            <div style={styles.metaRow}>
                <div>
                    <div style={styles.labelText}>LOCATION</div>
                    <div style={styles.locationText}>{item.location}</div>
                </div>
            </div>
        </BaseCard>
    );
};

// Simple SVG Icon
const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2, opacity: 0.8 }}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);