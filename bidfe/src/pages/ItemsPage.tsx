import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { itemStore } from "../features/item/model/item.store";
import { ItemCard } from "../features/item/ui/ItemCard";

export const ItemsPage = observer(() => {

    useEffect(() => {
        itemStore.loadItems();
    }, []);

    // Loading State
    if (itemStore.isLoading && itemStore.items.length === 0) {
        return (
            <div style={{ padding: 60, textAlign: "center", color: "#999", fontSize: "14px" }}>
                Loading inventory...
            </div>
        );
    }

    // Error State
    if (itemStore.error) {
        return (
            <div style={{ padding: 40 }}>
                <div style={{ color: "#dc2626", fontSize: "14px" }}>
                    Unable to load items: {itemStore.error}
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {itemStore.items.length === 0 ? (
                <div style={emptyStateStyle}>
                    <h3>No items available</h3>
                    <p>Check back later for new listings.</p>
                </div>
            ) : (
                <div style={gridStyle}>
                    {itemStore.items.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
});

const containerStyle: React.CSSProperties = {
    padding: "40px 24px",
    maxWidth: 1200,
    margin: "0 auto"
};

const gridStyle: React.CSSProperties = {
    display: "grid",
    // Cards min-width set to 260px for a clean look on desktop
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "40px 24px", // More vertical gap (40px) vs horizontal (24px)
    alignItems: "start"
};

const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: 80,
    color: "#999",
    padding: "40px",
    fontSize: "14px"
};