import { BaseCard } from "../../../widgets/BaseCard/BaseCard.tsx";
import styles from "../../../widgets/BaseCard/styles.ts";
import type { ItemDto } from "../types";

interface ItemCardProps {
    item: ItemDto;
}

export const ItemCard = ({ item }: ItemCardProps) => {
    // Safely access the first image's thumbnail
    const mainImage = item.images && item.images.length > 0
        ? item.images[0].thumbnailUrl
        : null;

    const specs = [item.transmission, item.drivetrain]
        .filter(Boolean)
        .join(" • ");

    return (
        <BaseCard
            to={`/items/${item.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                bottomLeft: (
                    <div style={styles.badgeDark}>
                        {/* Ensure number formatting */}
                        {item.mileage.toLocaleString()} mi
                    </div>
                ),
                // Example: Show a badge if it's sold
                ...(item.sold && {
                    topLeft: <div style={{...styles.badgeDark, backgroundColor: '#dc2626'}}>SOLD</div>
                })
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