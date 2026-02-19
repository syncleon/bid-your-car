import React from "react";
import type { ItemDto } from "../../../features/item/types";

// --- Layout Container ---
export const DetailPageLayout = ({ children }: { children: React.ReactNode }) => (
    <div style={styles.container}>{children}</div>
);

// --- Header ---
export const DetailHeader = ({ onBack, title }: { onBack: () => void, title?: string }) => (
    <div style={styles.headerRow}>
        <button onClick={onBack} style={minStyles.textBtn}>
            &larr; {title || "Back"}
        </button>
    </div>
);

// --- Image Gallery ---
interface GalleryProps {
    item: ItemDto;
    statusLabel?: React.ReactNode;
    onImageClick?: (index: number) => void;
}

export const ImageGallery = ({ item, statusLabel, onImageClick }: GalleryProps) => {
    const images = item.images || [];

    // Prioritize the MAIN category image, fallback to the first array item
    const mainImage = images.find(img => img.category === "MAIN")?.url || images[0]?.url;

    // We show max 4 thumbnails below the main image, excluding the main image from the thumbnail list
    const thumbnails = images.filter(img => img.url !== mainImage).slice(0, 4);
    const remainingCount = Math.max(0, images.length - 5);

    if (!mainImage) {
        return <div style={styles.placeholder}>No Photos Available</div>;
    }

    return (
        <div style={styles.galleryContainer}>
            <div
                style={styles.mainWrapper}
                onClick={() => onImageClick?.(0)}
            >
                <img src={mainImage} alt={item.model} style={styles.mainImg} />
                {statusLabel && <div style={styles.statusOverlay}>{statusLabel}</div>}
                <div style={styles.hoverOverlay}><span>View Fullscreen</span></div>
            </div>

            {thumbnails.length > 0 && (
                <div style={styles.thumbGrid}>
                    {thumbnails.map((img, idx) => {
                        // Correctly find the index in the original array for the lightbox
                        const realIndex = images.findIndex(origImg => origImg.id === img.id);
                        const isLastAndOverflowing = idx === 3 && remainingCount > 0;

                        return (
                            <div
                                key={img.id}
                                style={styles.thumbWrapper}
                                onClick={() => onImageClick?.(realIndex)}
                            >
                                <img src={img.url} alt={`View ${realIndex}`} style={styles.thumbImg} />
                                {isLastAndOverflowing && (
                                    <div style={styles.moreOverlay}>+{remainingCount + 1}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Vehicle Specs & Description (UPDATED) ---
export const VehicleInfo = ({ item }: { item: ItemDto }) => (
    <div>
        <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
        <p style={styles.subtitle}>{item.mileage.toLocaleString()} miles • {item.location}</p>

        {/* --- Highlight Tags --- */}
        {(item.hasServiceHistory || item.isModified) && (
            <div style={styles.tagsContainer}>
                {item.hasServiceHistory && <span style={styles.tag}>Service History</span>}
                {item.isModified && <span style={styles.tag}>Modified</span>}
            </div>
        )}

        <div style={styles.specsContainer}>
            <SpecItem label="VIN" value={item.vin} />
            <SpecItem label="Condition" value={item.condition?.replace('_', ' ')} />
            <SpecItem label="Title Status" value={item.titleStatus} />
            <SpecItem label="Engine" value={item.engine} />
            <SpecItem label="Fuel Type" value={item.fuelType} />
            <SpecItem label="Power" value={item.horsepower ? `${item.horsepower} hp` : null} />
            <SpecItem label="Trans" value={item.transmission} />
            <SpecItem label="Drivetrain" value={item.drivetrain} />
            <SpecItem label="Exterior" value={item.exteriorColor} />
            <SpecItem label="Interior" value={item.interiorColor} />
        </div>

        <div style={styles.divider} />

        <h3 style={styles.sectionTitle}>About this Vehicle</h3>
        <p style={styles.description}>{item.description || "No description provided."}</p>
    </div>
);

const SpecItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div style={styles.specItem}>
        <span style={styles.specLabel}>{label}</span>
        <span style={styles.specValue}>{value || "—"}</span>
    </div>
);

// --- Sidebar Card Helper ---
export const SidebarCard = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div style={styles.card}>
        {title && <div style={styles.cardTitle}>{title}</div>}
        {children}
    </div>
);

// --- Responsive Grid Helper ---
export const ResponsiveGrid = ({ children }: { children: React.ReactNode }) => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 900);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{
            ...styles.grid,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 380px",
            gap: isMobile ? "40px" : "80px"
        }}>
            {children}
        </div>
    );
};

// --- Shared Styles ---
const minStyles = {
    textBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit" } as React.CSSProperties,
};

const styles = {
    container: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
    headerRow: { marginBottom: 24, display: 'flex', justifyContent: 'space-between' },
    grid: { display: "grid", alignItems: "start" },

    galleryContainer: { display: "flex", flexDirection: "column" as const, gap: "12px", marginBottom: "32px" },
    mainWrapper: { position: "relative" as const, width: "100%", aspectRatio: "16/10", borderRadius: "12px", overflow: "hidden", cursor: "zoom-in", backgroundColor: "#f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
    mainImg: { width: "100%", height: "100%", objectFit: "cover" as const, transition: "transform 0.3s ease", },
    hoverOverlay: { position: "absolute" as const, inset: 0, background: "rgba(0,0,0,0.2)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "14px", pointerEvents: "none" as const, },
    statusOverlay: { position: "absolute" as const, top: 16, left: 16, zIndex: 10 },
    thumbGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" },
    thumbWrapper: { position: "relative" as const, aspectRatio: "4/3", borderRadius: "8px", overflow: "hidden", cursor: "pointer", backgroundColor: "#f3f4f6", },
    thumbImg: { width: "100%", height: "100%", objectFit: "cover" as const, },
    moreOverlay: { position: "absolute" as const, inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600, backdropFilter: "blur(2px)" },
    placeholder: { width: "100%", height: "300px", backgroundColor: "#f3f4f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" },

    title: { fontSize: "32px", fontWeight: 700, color: "#111", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
    subtitle: { fontSize: "18px", color: "#555", margin: 0 },

    // --- New Tag Styles ---
    tagsContainer: { display: "flex", gap: "8px", marginTop: "16px" },
    tag: { padding: "4px 10px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "16px", fontSize: "12px", fontWeight: 600, color: "#475569" },

    specsContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px", marginTop: "24px", padding: "24px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" },
    specItem: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    specLabel: { fontSize: "13px", color: "#888", fontWeight: 500, textTransform: "uppercase" as const },
    specValue: { fontSize: "15px", color: "#111", fontWeight: 500 },
    divider: { height: "1px", backgroundColor: "#eee", margin: "40px 0" },
    sectionTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "16px" },
    description: { fontSize: "16px", lineHeight: 1.6, color: "#333", whiteSpace: "pre-wrap" as const },

    card: { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", marginBottom: "24px" },
    cardTitle: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: "#999", marginBottom: "16px" },
};