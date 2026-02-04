import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { BiddingCard } from "./BiddingCard";
import { BidHistory } from "./BidHistory";
import { minStyles } from "../../profile/ui/minimalStyles"; // Reusing consistent styles

export const AuctionDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auctionStore } = useStore();

    useEffect(() => {
        if (id) {
            auctionStore.loadAuctionDetails(id);
        }
        return () => auctionStore.clearSelectedAuction();
    }, [id, auctionStore]);

    if (auctionStore.isLoading) {
        return <div style={{ padding: 80, textAlign: "center", color: "#666" }}>Loading auction details...</div>;
    }

    if (auctionStore.error || !auctionStore.selectedAuction) {
        return (
            <div style={{ padding: 80, textAlign: "center" }}>
                <h3 style={{ color: "#dc2626" }}>Auction not found</h3>
                <button onClick={() => navigate("/auctions")} style={minStyles.textBtn}>
                    &larr; Back to Auctions
                </button>
            </div>
        );
    }

    const auction = auctionStore.selectedAuction;
    const item = auction.item;
    const mainImage = item.images?.[0]?.fullHdUrl || item.images?.[0]?.originalUrl;

    return (
        <div style={styles.container}>
            {/* Breadcrumb / Back */}
            <button onClick={() => navigate("/auctions")} style={{ ...minStyles.textBtn, marginBottom: 16 }}>
                &larr; Back to Inventory
            </button>

            <div style={styles.grid}>
                {/* LEFT COLUMN: Media & Details */}
                <div style={styles.mainCol}>
                    {/* Main Image */}
                    <div style={styles.imageContainer}>
                        {mainImage ? (
                            <img src={mainImage} alt={item.model} style={styles.mainImg} />
                        ) : (
                            <div style={styles.placeholder}>No Photos Available</div>
                        )}
                        <div style={styles.statusBadge}>
                            {auction.status === 'ACTIVE' ? '● LIVE' : auction.status}
                        </div>
                    </div>

                    {/* Image Gallery Grid (thumbnails) */}
                    {item.images.length > 1 && (
                        <div style={styles.thumbGrid}>
                            {item.images.slice(1, 5).map(img => (
                                <img key={img.id} src={img.thumbnailUrl} alt="Gallery" style={styles.thumb} />
                            ))}
                        </div>
                    )}

                    {/* Car Info */}
                    <div style={styles.section}>
                        <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
                        <p style={styles.subtitle}>
                            {item.mileage.toLocaleString()} miles • {item.location}
                        </p>

                        <div style={styles.specsGrid}>
                            <SpecItem label="Engine" value={item.engine} />
                            <SpecItem label="Transmission" value={item.transmission} />
                            <SpecItem label="Drivetrain" value={item.drivetrain} />
                            <SpecItem label="Exterior" value={item.exteriorColor} />
                            <SpecItem label="Interior" value={item.interiorColor} />
                            <SpecItem label="VIN" value={item.vin} />
                        </div>

                        <div style={styles.divider} />

                        <h3 style={styles.sectionTitle}>Story</h3>
                        <p style={styles.description}>{item.description || "No description provided."}</p>
                    </div>
                </div>

                {/* RIGHT COLUMN: Bidding Interface */}
                <div style={styles.sidebar}>
                    <BiddingCard auction={auction} />
                    <BidHistory bids={auctionStore.bidHistory} />
                </div>
            </div>
        </div>
    );
});

// --- Sub-components ---

const SpecItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>{label}</div>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#111" }}>{value || "N/A"}</div>
    </div>
);

// --- Styles ---

const styles = {
    container: { maxWidth: 1200, margin: "0 auto", padding: "24px" },
    grid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "40px", alignItems: "start" },
    mainCol: { minWidth: 0 }, // Prevent grid blowout
    sidebar: { position: "sticky" as const, top: "24px", display: "flex", flexDirection: "column" as const, gap: "24px" },

    imageContainer: {
        width: "100%", aspectRatio: "16/10", backgroundColor: "#f3f4f6",
        borderRadius: "12px", overflow: "hidden", position: "relative" as const, marginBottom: "16px"
    },
    mainImg: { width: "100%", height: "100%", objectFit: "cover" as const },
    placeholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" },

    statusBadge: {
        position: "absolute" as const, top: "16px", left: "16px",
        backgroundColor: "rgba(0,0,0,0.8)", color: "#fff",
        padding: "6px 12px", borderRadius: "20px",
        fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px"
    },

    thumbGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" },
    thumb: { width: "100%", aspectRatio: "4/3", borderRadius: "8px", objectFit: "cover" as const, backgroundColor: "#eee" },

    section: { marginBottom: "40px" },
    title: { fontSize: "32px", fontWeight: 800, color: "#111", margin: "0 0 8px 0", lineHeight: 1.1 },
    subtitle: { fontSize: "16px", color: "#555", margin: 0 },

    specsGrid: {
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 12px",
        marginTop: "32px", padding: "24px", backgroundColor: "#f8fafc", borderRadius: "12px"
    },

    divider: { height: "1px", backgroundColor: "#eee", margin: "40px 0" },
    sectionTitle: { fontSize: "20px", fontWeight: 700, marginBottom: "16px" },
    description: { fontSize: "16px", lineHeight: 1.6, color: "#333", whiteSpace: "pre-wrap" as const },

    // Responsive adjustment for mobile (basic)
    "@media (max-width: 768px)": {
        grid: { gridTemplateColumns: "1fr" },
        sidebar: { position: "static" as const }
    }
};