import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import styles from "../../../widgets/BaseCard/styles";
import type { ItemDto } from "../types";

interface ItemCardProps {
    item: ItemDto;
}

export const ItemCard = ({ item }: ItemCardProps) => {
    const mainImage = item.thumbnailUrl ||
        item.images?.find(img => img.category === "MAIN")?.url ||
        item.images?.[0]?.url;

    const specs = [item.transmission, item.drivetrain, item.fuelType]
        .filter(Boolean)
        .join(" • ");

    const isLive = item.status === 'ACTIVE_AUCTION';
    const isSold = item.status === 'SOLD';
    const isPending = item.status === 'PENDING_AUCTION';
    const isScheduled = item.status === 'LISTED_AUCTION';
    const isUnsold = item.status === 'UNSOLD';
    const isDraft = item.status === 'DRAFT';
    const isRejected = item.status === 'REJECTED';
        let statusText = "Draft";
    let statusColor = "#94a3b8";
    
    if (isSold) {
        statusText = "Sold";
        statusColor = "#dc2626";
    } else if (isLive) {
        statusText = "Live Auction";
        statusColor = "#ef4444";
    } else if (isScheduled) {
        statusText = "Scheduled";
        statusColor = "var(--color-primary)";
    } else if (isPending) {
        statusText = "Pending";
        statusColor = "#f59e0b";
    } else if (isRejected) {
        statusText = "Rejected";
        statusColor = "#ef4444";
    } else if (isUnsold) {
        statusText = "Unsold";
        statusColor = "#475569";
    }

    return (
        <BaseCard
            to={`/items/${item.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                topLeft: (
                    <div style={{ ...styles.badge, backgroundColor: statusColor, color: '#fff' }}>
                        {statusText}
                    </div>
                ),
                topRight: null,

                bottomLeft: (
                    <div style={styles.badgeDark}>
                        {item.mileage.toLocaleString()} km
                    </div>
                )
            }}
        >
            <div style={styles.metaRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: '4px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Condition: <span style={{ color: 'var(--text-primary)' }}>{item.condition.replace('_', ' ')}</span>
                    </div>
                </div>
                <div style={styles.locationText}>{item.location}</div>
            </div>

            {specs && <div style={styles.specsText}>{specs}</div>}
        </BaseCard>
    );
};