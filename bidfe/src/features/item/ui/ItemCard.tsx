import type { ItemDto } from "../types";

interface Props {
    item: ItemDto;
}

export const ItemCard = ({ item }: Props) => {
    return (
        <div style={cardStyle}>
            {/* Placeholder Image */}
            <div style={imagePlaceholderStyle}>
                Running Car
            </div>

            <div style={{ padding: "16px" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>
                    {item.make} {item.model}
                </h3>

                <div style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>
                    {item.location}
                </div>

                <div style={infoRowStyle}>
                    <span>VIN:</span>
                    <span style={{ fontFamily: "monospace" }}>{item.vin}</span>
                </div>

                {item.buyNowPrice && (
                    <div style={{ marginTop: 12, fontWeight: "bold", fontSize: 18 }}>
                        ${item.buyNowPrice.toLocaleString()}
                    </div>
                )}

                {!item.buyNowPrice && (
                    <div style={{ marginTop: 12, color: "#888", fontStyle: "italic" }}>
                        Bidding Only
                    </div>
                )}
            </div>
        </div>
    );
};

// Styles
const cardStyle: React.CSSProperties = {
    border: "1px solid #eaeaea",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer"
};

const imagePlaceholderStyle: React.CSSProperties = {
    height: 200,
    background: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontWeight: 500
};

const infoRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#555",
    marginTop: 4
};