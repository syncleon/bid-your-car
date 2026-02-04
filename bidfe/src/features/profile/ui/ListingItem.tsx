import { memo } from "react";
import styles from "./mylistingstyles.ts";
import type {ItemDto} from "../../item/types.ts";
import {ItemCard} from "../../item/ui/ItemCard.tsx";

interface ListingItemProps {
    item: ItemDto;
    onEdit: (item: ItemDto) => void;
    onAuction: (item: ItemDto) => void;
    onDelete: (id: string) => void;
    onCancel: (id: string) => void;
}

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

    const renderActions = () => {
        // Backend Flag: isSold
        if (item.sold) {
            return <span style={styles.statusSold}>Sold</span>;
        }

        // Backend Flag: isActive
        if (item.active) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}/>
                        Live Auction
                    </span>
                    <button onClick={handleCancel} style={styles.btnDestructive}>
                        Cancel
                    </button>
                </div>
            );
        }

        // Backend Flag: isAvailable (Draft, Expired, Cancelled)
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
            <ItemCard item={item} />
            <div style={styles.actionRow}>
                {renderActions()}
            </div>
        </div>
    );
});