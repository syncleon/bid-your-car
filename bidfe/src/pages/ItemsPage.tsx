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
            {/* Header Section */}
            <div style={{ marginBottom: 40, paddingBottom: 20, borderBottom: "1px solid #f0f0f0" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 300, margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
                    Inventory
                </h1>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>
                        Browse curated vehicles available for immediate purchase.
                    </p>
                    <span style={{ fontSize: "13px", color: "#666", fontWeight: 500 }}>
                        {itemStore.items.length} results
                    </span>
                </div>
            </div>

            {/* Grid Section */}
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

// --- Minimal Page Styles ---

const containerStyle: React.CSSProperties = {
    padding: "40px 24px",
    maxWidth: 1200, // Slightly tighter max-width for better density
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