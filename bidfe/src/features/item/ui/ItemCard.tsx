import {BaseCard} from "../../../widgets/BaseCard/BaseCard.tsx";
import styles from "../../../widgets/BaseCard/styles.ts";
import type {ItemDto} from "../types.ts"; // Adjust path as needed

interface ItemCardProps {
    item: ItemDto;
}

export const ItemCard = ({ item }: ItemCardProps) => {
    const mainImage = item.images?.[0]?.thumbnailUrl;

    const specs = [item.transmission, item.drivetrain]
        .filter(Boolean)
        .join(" • ");

    return (
        <BaseCard
            to={`/items/${item.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                // Item specific: Mileage on bottom left
                bottomLeft: (
                    <div style={styles.badgeDark}>
                        {item.mileage.toLocaleString()} mi
                    </div>
                ),
            }}
        >
            {/* Content Body */}
            <div style={styles.metaRow}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Add Price here if your DTO has it, otherwise empty like before */}
                </div>
                <div style={styles.locationText}>{item.location}</div>
            </div>

            {specs && <div style={styles.specsText}>{specs}</div>}
        </BaseCard>
    );
};