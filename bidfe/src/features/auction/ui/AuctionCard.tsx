import { useState, useEffect } from "react";
import { BaseCard } from "../../../widgets/BaseCard/BaseCard.tsx";
import styles from "../../../widgets/BaseCard/styles.ts";
import type { AuctionDto } from "../types";

interface AuctionCardProps {
    auction: AuctionDto;
}

export const AuctionCard = ({ auction }: AuctionCardProps) => {
    const { item, currentHighestBid, startPrice, endTime, bidCount } = auction;
    const price = currentHighestBid ?? startPrice;

    // Safely access the first image thumbnail
    const mainImage = item.images && item.images.length > 0
        ? item.images[0].thumbnailUrl
        : null;

    // --- Timer Logic ---
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const endDate = new Date(endTime);
    const timeRemaining = endDate.getTime() - now;
    const isEnded = timeRemaining <= 0;
    const isUrgent = timeRemaining > 0 && timeRemaining < 60 * 60 * 1000;

    let timerText = "Ended";
    if (!isEnded) {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) timerText = `${days}d ${hours}h`;
        else if (hours > 0) timerText = `${hours}h ${minutes}m`;
        else timerText = `${minutes}m ${Math.floor((timeRemaining % (1000 * 60)) / 1000)}s`;
    }

    return (
        <BaseCard
            to={`/auctions/${auction.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                topLeft: (
                    <div style={styles.badgeLive}>
                        <span style={styles.dot} /> LIVE
                    </div>
                ),
                bottomLeft: (
                    <div
                        style={{
                            ...styles.badgeTimer,
                            background: isUrgent ? "#dc2626" : "rgba(255, 255, 255, 0.95)",
                            color: isUrgent ? "#fff" : "#111",
                        }}
                    >
                        <ClockIcon /> {timerText}
                    </div>
                ),
                bottomRight: (
                    <div style={styles.badgeDark}>
                        {bidCount} {bidCount === 1 ? "Bid" : "Bids"}
                    </div>
                )
            }}
        >
            <div style={styles.metaRow}>
                <div>
                    <div style={styles.labelText}>CURRENT BID</div>
                    <div style={styles.priceText}>${price.toLocaleString()}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={styles.labelText}>LOCATION</div>
                    <div style={styles.locationText}>{item.location}</div>
                </div>
            </div>
        </BaseCard>
    );
};

const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);