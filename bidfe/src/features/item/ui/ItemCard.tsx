import { Link } from "react-router-dom";
import type { ItemDto } from "../types";

interface Props {
    item: ItemDto;
}

export const ItemCard = ({ item }: Props) => {
    const mainImage = item.images && item.images.length > 0
        ? item.images[0].thumbnailUrl
        : null;

    const specs = [
        item.transmission,
        item.drivetrain,
        item.titleStatus ? `${item.titleStatus} Title` : null
    ].filter(Boolean).join(" • ");

    return (
        <Link to={`/items/${item.id}`} className="item-card-link" style={linkStyle}>
            <div style={containerStyle}>
                {/* Image Area */}
                <div className="image-wrapper" style={imageWrapperStyle}>
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={`${item.year} ${item.make} ${item.model}`}
                            style={imageStyle}
                            loading="lazy"
                        />
                    ) : (
                        <div style={placeholderStyle}>No Photos</div>
                    )}

                    <div style={badgeStyle}>
                        {item.mileage.toLocaleString()} mi
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ paddingTop: "12px" }}>
                    <div style={headerStyle}>
                        <h3 style={titleStyle}>
                            <span style={{ color: "#777", fontWeight: 400, marginRight: "4px" }}>{item.year}</span>
                            {item.make} {item.model}
                        </h3>
                    </div>

                    <div style={priceRowStyle}>
                        <div style={priceContainerStyle}>
                            <span style={labelStyle}>{item.buyNowPrice ? "BUY NOW" : "AUCTION"}</span>
                            <span style={priceStyle}>
                                {item.buyNowPrice ? `$${item.buyNowPrice.toLocaleString()}` : "Bid Only"}
                            </span>
                        </div>
                        <div style={locationStyle}>{item.location}</div>
                    </div>

                    {specs && <div style={specsStyle}>{specs}</div>}
                </div>
            </div>
        </Link>
    );
};

// --- Styles remain the same (minus plusBtnStyle) ---
const linkStyle: React.CSSProperties = { textDecoration: 'none', color: 'inherit', display: 'block' };
const containerStyle: React.CSSProperties = { cursor: "pointer" };
const imageWrapperStyle: React.CSSProperties = { aspectRatio: "16/10", width: "100%", background: "#f4f4f4", borderRadius: "4px", overflow: "hidden", position: "relative" };
const imageStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
const badgeStyle: React.CSSProperties = { position: "absolute", bottom: "8px", left: "8px", background: "rgba(0, 0, 0, 0.7)", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, backdropFilter: "blur(4px)" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "17px", fontWeight: 600, color: "#111", lineHeight: 1.2 };
const priceRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end" };
const priceContainerStyle: React.CSSProperties = { display: "flex", flexDirection: "column" };
const labelStyle: React.CSSProperties = { fontSize: "9px", fontWeight: 800, color: "#888", letterSpacing: "0.5px", marginBottom: "2px" };
const priceStyle: React.CSSProperties = { fontSize: "15px", fontWeight: 700, color: "#111" };
const locationStyle: React.CSSProperties = { fontSize: "12px", color: "#666" };
const specsStyle: React.CSSProperties = { fontSize: "12px", color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "8px", borderTop: "1px solid #eee", paddingTop: "8px" };
const placeholderStyle: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: "12px" };