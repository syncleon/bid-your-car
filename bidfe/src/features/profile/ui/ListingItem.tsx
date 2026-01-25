import { memo } from "react";
import { ItemCard } from "../../item/ui/ItemCard"; // Ensure path is correct
import type { ItemDto } from "../../item/types";
import styles from "./mylistingstyles.ts";

interface ListingItemProps {
    item: ItemDto;
    onEdit: (item: ItemDto) => void;
    onAuction: (item: ItemDto) => void;
    onDelete: (id: string) => void;
    onCancel: (id: string) => void;
}

// React.memo ensures this only re-renders if this specific item changes
export const ListingItem = memo(({ item, onEdit, onAuction, onDelete, onCancel }: ListingItemProps) => {

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this car? This cannot be undone.")) {
            onDelete(item.id);
        }
    };

    const handleCancel = () => {
        if (window.confirm("Are you sure you want to cancel this active auction?")) {
            onCancel(item.id);
        }
    };

    // Encapsulate status logic here
    const renderActions = () => {
        if (item.sold) {
            return <span style={styles.statusSold}>Sold</span>;
        }

        if (item.active) {
            return (
                <button onClick={handleCancel} style={styles.btnDestructive}>
                Cancel Auction
            </button>
        );
        }

        // Default: Available (Draft, Expired, etc)
        if (item.available) {
            return (
                <div style={styles.actionGroup}>
                <button onClick={() => onAuction(item)} style={styles.btnPrimary}>
                List for Auction
                         </button>
                         <span style={styles.divider}>|</span>
                <button onClick={() => onEdit(item)} style={styles.btnNeutral}>
                Edit
                </button>
                <span style={styles.divider}>|</span>
                <button onClick={handleDelete} style={styles.btnDestructive}>
                Delete
                </button>
                </div>
        );
        }

        return null;
    };

    return (
        <div style={styles.cardContainer}>
            {/* The Reusable Card */}
            <ItemCard item={item} />

    {/* The Actions Footer */}
    <div style={styles.actionRow}>
        {renderActions()}
        </div>
        </div>
);
});