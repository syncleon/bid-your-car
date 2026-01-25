import type { ItemDto } from "../../item/types";
import { ListingItem } from "./ListingItem"; // Import the sub-component above
import { minStyles } from "./minimalStyles";
import styles from "./mylistingstyles.ts";

interface Props {
    items: ItemDto[];
    isLoading: boolean;
    onCreate: () => void;
    onEdit: (item: ItemDto) => void;
    onAuction: (item: ItemDto) => void;
    onDelete: (id: string) => void;
    onCancel: (id: string) => void;
}

export const MyListingsSection = ({
                                      items,
                                      isLoading,
                                      onCreate,
                                      onEdit,
                                      onAuction,
                                      onDelete,
                                      onCancel
                                  }: Props) => {

    return (
        <section style={styles.section}>
            {/* Header */}
            <div style={styles.headerRow}>
                <h2 style={{ ...minStyles.header, marginBottom: 0 }}>My Garage</h2>
                <button onClick={onCreate} style={minStyles.primaryBtn}>
                    + Create New
                </button>
            </div>

            {/* Content Switch */}
            {isLoading ? (
                <ListingsSkeleton />
            ) : items.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No active listings found.</p>
                    <button onClick={onCreate} style={styles.linkBtn}>Add your first car</button>
                </div>
            ) : (
                <div style={styles.grid}>
                    {items.map((item) => (
                        <ListingItem
                            key={item.id}
                            item={item}
                            onEdit={onEdit}
                            onAuction={onAuction}
                            onDelete={onDelete}
                            onCancel={onCancel}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

const ListingsSkeleton = () => (
    <div style={styles.grid}>
        {[1, 2, 3].map((i) => (
            <div key={i} style={{ ...styles.cardContainer, opacity: 0.6 }}>
                <div style={{ aspectRatio: "16/10", background: "#f3f4f6", borderRadius: "4px", marginBottom: "12px" }} />
                <div style={{ height: "20px", width: "70%", background: "#f3f4f6", marginBottom: "8px" }} />
                <div style={{ height: "20px", width: "40%", background: "#f3f4f6" }} />
            </div>
        ))}
    </div>
);