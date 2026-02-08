import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import styles from "../../../widgets/BaseCard/styles";
import type { ItemDto } from "../types";

interface ItemCardProps {
    item: ItemDto;
}

export const ItemCard = ({ item }: ItemCardProps) => {
    // Priority: Preview (Optimized) -> Thumbnail -> Original
    const mainImage = item.images && item.images.length > 0
        ? (item.images[0].previewUrl || item.images[0].thumbnailUrl)
        : null;

    const specs = [item.transmission, item.drivetrain]
        .filter(Boolean)
        .join(" • ");

    // --- Status Logic ---
    const isLive = !!item.activeAuctionId; // Has an active auction ID
    const isPending = item.auctionStatus === 'PENDING_APPROVAL';
    const isSold = item.sold || item.auctionStatus === 'SOLD';
    const isRejected = item.auctionStatus === 'REJECTED';

    // --- Render Badge based on status ---
    let statusBadge = null;

    if (isSold) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: '#dc2626', color: '#fff' }}>
                SOLD
            </div>
        );
    } else if (isLive) {
        statusBadge = (
            <div style={styles.badgeLive}>
                <span style={styles.dot} /> LIVE AUCTION
            </div>
        );
    } else if (isPending) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: '#f59e0b', color: '#fff' }}>
                PENDING
            </div>
        );
    } else if (isRejected) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: '#7f1d1d', color: '#fff' }}>
                REJECTED
            </div>
        );
    }

    return (
        <BaseCard
            to={`/items/${item.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                // 1. Status Badge (Top Left)
                topLeft: statusBadge,

                // 2. Mileage Badge (Bottom Left)
                bottomLeft: (
                    <div style={styles.badgeDark}>
                        {item.mileage.toLocaleString()} mi
                    </div>
                )
            }}
        >
            <div style={styles.metaRow}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Placeholder for Price if added later */}
                </div>
                <div style={styles.locationText}>{item.location}</div>
            </div>

            {specs && <div style={styles.specsText}>{specs}</div>}
        </BaseCard>
    );
};