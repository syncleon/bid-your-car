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
    } else if (isScheduled) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                SCHEDULED
            </div>
        );
    } else if (isPending) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: '#f59e0b', color: '#fff' }}>
                NEEDS ADMIN APPROVAL
            </div>
        );
    } else if (isRejected) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: '#ef4444', color: '#fff' }}>
                REJECTED
            </div>
        );
    } else if (isUnsold) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: '#475569', color: '#fff' }}>
                UNSOLD
            </div>
        );
    } else if (isDraft) {
        statusBadge = (
            <div style={{ ...styles.badge, backgroundColor: '#94a3b8', color: '#fff' }}>
                DRAFT
            </div>
        );
    }

    return (
        <BaseCard
            to={`/items/${item.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                topLeft: statusBadge,
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