import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { itemStore } from "../features/item/model/item.store";
import { ItemCard } from "../features/item/ui/ItemCard";

export const ItemsPage = observer(() => {

    useEffect(() => {
        itemStore.loadItems();
    }, []);

    if (itemStore.isLoading && itemStore.items.length === 0) {
        return (
            <div style={containerStyle}>
                <p style={{textAlign: 'center', color: '#666'}}>Loading marketplace...</p>
            </div>
        );
    }

    if (itemStore.error) {
        return (
            <div style={containerStyle}>
                <div style={{ padding: 24, color: "#dc2626", background: "#fef2f2", borderRadius: 8 }}>
                    Error: {itemStore.error}
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 32 }}>Inventory</h1>
                    <p style={{ color: "#666", margin: "8px 0 0" }}>Browse quality vehicles available now</p>
                </div>
                <span style={{ color: "#666", fontSize: 14, background: "#f3f4f6", padding: "6px 12px", borderRadius: 20 }}>
                    {itemStore.items.length} vehicles
                </span>
            </div>

            {itemStore.items.length === 0 ? (
                <div style={emptyStateStyle}>
                    <h3>No items found</h3>
                    <p>Be the first to list a car!</p>
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

// --- Styles ---

const containerStyle: React.CSSProperties = {
    padding: "40px 24px",
    maxWidth: 1280,
    margin: "0 auto"
};

const gridStyle: React.CSSProperties = {
    display: "grid",
    // Responsive grid: Cards are min 300px wide
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "32px",
    alignItems: "stretch"
};

const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: 80,
    color: "#666",
    padding: "60px",
    background: "#f9fafb",
    borderRadius: 12
};