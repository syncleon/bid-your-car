import { Link } from "react-router-dom";
import type { ItemDto } from "../types";

interface Props {
    item: ItemDto;
}

export const ItemCard = ({ item }: Props) => {
    // ✅ Logic: Get the first image or null
    const mainImage = item.images && item.images.length > 0
        ? item.images[0].thumbnailUrl
        : null;

    return (
        <Link to={`/items/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={cardStyle}>

                {/* ✅ Image Area */}
                <div style={imageContainerStyle}>
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={`${item.make} ${item.model}`}
                            style={imageStyle}
                            loading="lazy"
                        />
                    ) : (
                        <div style={placeholderStyle}>
                            No Photos
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>
                            {item.make} {item.model}
                        </h3>
                        {item.buyNowPrice && (
                            <span style={priceStyle}>
                                ${item.buyNowPrice.toLocaleString()}
                            </span>
                        )}
                    </div>

                    <div style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>
                        {item.location}
                    </div>

                    {/* Specs Tags */}
                    <div style={tagsContainerStyle}>
                        {item.engine && <span style={tagStyle}>{item.engine}</span>}
                        {item.transmission && <span style={tagStyle}>{item.transmission}</span>}
                        <span style={tagStyle}>{item.vin.slice(-6)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// --- Styles ---

const cardStyle: React.CSSProperties = {
    border: "1px solid #eaeaea",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    height: "100%",
    display: "flex",
    flexDirection: "column"
};

const imageContainerStyle: React.CSSProperties = {
    height: 220,
    width: "100%",
    background: "#f9fafb",
    position: "relative",
    borderBottom: "1px solid #f0f0f0"
};

const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover", // Ensures image fills box without stretching
    display: "block"
};

const placeholderStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "14px",
    fontWeight: 500,
    background: "#f3f4f6"
};

const priceStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 16,
    color: "#059669", // Green color for price
    background: "#ecfdf5",
    padding: "2px 8px",
    borderRadius: "4px"
};

const tagsContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    flexWrap: "wrap"
};

const tagStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#4b5563",
    background: "#f3f4f6",
    padding: "4px 8px",
    borderRadius: "4px",
    whiteSpace: "nowrap"
};