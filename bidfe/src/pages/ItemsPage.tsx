import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { itemStore } from "../features/item/model/item.store";
import { ItemCard } from "../features/item/ui/ItemCard";

export const ItemsPage = observer(() => {

    // Fetch items on mount
    useEffect(() => {
        itemStore.loadItems();
    }, []);

    if (itemStore.isLoading && itemStore.items.length === 0) {
        return <div style={{ padding: 24 }}>Loading auctions...</div>;
    }

    if (itemStore.error) {
        return <div style={{ padding: 24, color: "red" }}>Error: {itemStore.error}</div>;
    }

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1>Live Auctions</h1>
                <span style={{ color: "#666" }}>{itemStore.items.length} items found</span>
            </div>

            {itemStore.items.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: 40, color: "#666" }}>
                    <p>No active auctions found.</p>
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

// Responsive Grid Style
const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px"
};