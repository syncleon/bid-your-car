import { Link } from "react-router-dom";
import type { ItemDto } from "../types";

interface Props {
    item: ItemDto;
}

export const ItemCard = ({ item }: Props) => {
    // Get the first image or null
    const mainImage = item.images && item.images.length > 0
        ? item.images[0].thumbnailUrl
        : null;

    // Helper to join specs safely
    const specs = [item.engine, item.transmission, item.drivetrain]
        .filter(Boolean)
        .join(" • ");

    return (
        <Link to={`/items/${item.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={containerStyle}>

                {/* Image Area */}
                <div style={imageWrapperStyle}>
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={`${item.make} ${item.model}`}
                            style={imageStyle}
                            loading="lazy"
                        />
                    ) : (
                        <div style={placeholderStyle}>No Photos</div>
                    )}
                </div>

                {/* Content Area */}
                <div style={{ paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <h3 style={titleStyle}>
                            {item.make} {item.model}
                        </h3>
                        {item.buyNowPrice ? (
                            <span style={priceStyle}>${item.buyNowPrice.toLocaleString()}</span>
                        ) : (
                            <span style={{ fontSize: "14px", color: "#999", fontStyle: "italic" }}>Bid Only</span>
                        )}
                    </div>

                    {/* Location */}
                    <div style={metaStyle}>
                        {item.location}
                    </div>

                    {/* Minimal Specs Line */}
                    {specs && (
                        <div style={specsStyle}>
                            {specs}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

// --- Minimal Styles ---

const containerStyle: React.CSSProperties = {
    cursor: "pointer",
    transition: "opacity 0.2s",
    // No border, no shadow, just content
};

const imageWrapperStyle: React.CSSProperties = {
    aspectRatio: "4/3",
    width: "100%",
    background: "#f4f4f4",
    borderRadius: "8px", // Subtle rounding
    overflow: "hidden",
    position: "relative",
};

const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.3s ease",
};

const placeholderStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontSize: "13px",
    background: "#f9fafb",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "#111",
    letterSpacing: "-0.3px",
};

const priceStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 500,
    color: "#111", // Keeping price neutral/black looks more premium/minimal
};

const metaStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#666",
    marginBottom: "4px",
};

const specsStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#888",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: "6px"
};