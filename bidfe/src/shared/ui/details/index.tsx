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
    textBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit", transition: "color 0.3s ease" } as React.CSSProperties,
};

const styles = {
    container: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: "var(--text-primary)", transition: "color 0.3s ease" },
    headerRow: { marginBottom: 24, display: 'flex', justifyContent: 'space-between' },
    grid: { display: "grid", alignItems: "start" },

    galleryContainer: { display: "flex", flexDirection: "column" as const, gap: "12px", marginBottom: "32px" },
    mainWrapper: { position: "relative" as const, width: "100%", aspectRatio: "16/10", borderRadius: "12px", overflow: "hidden", cursor: "zoom-in", backgroundColor: "var(--bg-input)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "background-color 0.3s ease" },
    mainImg: { width: "100%", height: "100%", objectFit: "cover" as const, transition: "transform 0.3s ease", },
    hoverOverlay: { position: "absolute" as const, inset: 0, background: "rgba(0,0,0,0.2)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "14px", pointerEvents: "none" as const, },
    statusOverlay: { position: "absolute" as const, top: 16, left: 16, zIndex: 10 },
    thumbGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" },
    thumbWrapper: { position: "relative" as const, aspectRatio: "4/3", borderRadius: "8px", overflow: "hidden", cursor: "pointer", backgroundColor: "var(--bg-input)", transition: "background-color 0.3s ease" },
    thumbImg: { width: "100%", height: "100%", objectFit: "cover" as const, },
    moreOverlay: { position: "absolute" as const, inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600, backdropFilter: "blur(2px)" },
    placeholder: { width: "100%", height: "300px", backgroundColor: "var(--bg-input)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px", transition: "background-color 0.3s ease, color 0.3s ease" },

    title: { fontSize: "32px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px 0", letterSpacing: "-0.5px", transition: "color 0.3s ease" },
    subtitle: { fontSize: "18px", color: "var(--text-secondary)", margin: 0, transition: "color 0.3s ease" },

    // --- New Tag Styles ---
    tagsContainer: { display: "flex", gap: "8px", marginTop: "16px" },
    tag: { padding: "4px 10px", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border-color)", borderRadius: "16px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease" },

    specsContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px", marginTop: "24px", padding: "24px 0", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", transition: "border-color 0.3s ease" },
    specItem: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    specLabel: { fontSize: "13px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase" as const, transition: "color 0.3s ease" },
    specValue: { fontSize: "15px", color: "var(--text-primary)", fontWeight: 500, transition: "color 0.3s ease" },
    divider: { height: "1px", backgroundColor: "var(--border-color)", margin: "40px 0", transition: "background-color 0.3s ease" },
    sectionTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)", transition: "color 0.3s ease" },
    description: { fontSize: "16px", lineHeight: 1.6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" as const, transition: "color 0.3s ease" },

    card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "24px", marginBottom: "24px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
    cardTitle: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "16px", transition: "color 0.3s ease" },
};