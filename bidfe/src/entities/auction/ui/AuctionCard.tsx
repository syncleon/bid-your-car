
import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import styles from "../../../widgets/BaseCard/styles";
import type { AuctionDto } from "../types";
import { useAuctionTimer } from "../../../shared/hooks/useAuctionTimer";

interface Props {
    auction: AuctionDto;
}

export const AuctionCard = ({ auction }: Props) => {
    const { item, currentPrice, endTime, status } = auction;
    const { timeLeft, isEnded } = useAuctionTimer(endTime);
    const price = currentPrice;

    const firstImage = item.images?.[0];
    const mainImage = firstImage ? firstImage.url : item.thumbnailUrl;

    const isActive = status === 'ACTIVE';
    const isPending = status === 'PENDING_APPROVAL';
    const isSold = status === 'SOLD';

    const activeTimerStyle = { ...styles.badgeTimer, gap: "6px" };


    return (
        <BaseCard
            to={`/auctions/${auction.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                topLeft: (
                    <>
                        {isPending && (
                            <div style={{...styles.badge, background: "var(--color-warning-bg)", color: "var(--color-warning-text)", border: "1px solid var(--color-warning-border)"}}>
                                PENDING
                            </div>
                        )}
                        {isSold && (
                            <div style={{...styles.badge, background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)"}}>
                                SOLD
                            </div>
                        )}
                        {!isSold && !isPending && isEnded && (
                            <div style={styles.badgeEnded}>ENDED</div>
                        )}
                    </>
                ),

                bottomLeft: (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>
                            {isSold ? "Sold For" : (isEnded ? "Final Bid" : "Current Bid")}
                        </span>
                        <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                            ${price.toLocaleString()}
                        </span>
                    </div>
                ),
                bottomRight: (
                    <>
                        {isActive && !isEnded && timeLeft && (
                            <div style={{...activeTimerStyle, gap: "6px"}}>
                                <ClockIcon color="currentColor" />
                                <span>{timeLeft}</span>
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

const ClockIcon = ({ color = "currentColor" }: { color?: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2, opacity: 0.9 }}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);