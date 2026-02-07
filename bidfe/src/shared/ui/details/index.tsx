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
export const ImageGallery = ({ item, statusLabel }: { item: ItemDto, statusLabel?: React.ReactNode }) => {
    // UPDATE: Ensure we use the Full HD URL for the hero image
    const mainImage = item.images?.[0]?.fullHdUrl || item.images?.[0]?.originalUrl;

    return (
        <div style={{ marginBottom: 40 }}>
            <div style={styles.imageContainer}>
                {mainImage ? (
                    <img src={mainImage} alt={item.model} style={styles.mainImg} />
                ) : (
                    <div style={styles.placeholder}>No Photos</div>
                )}
                {statusLabel && <div style={styles.statusOverlay}>{statusLabel}</div>}
            </div>

            {item.images.length > 1 && (
                <div style={styles.thumbGrid}>
                    {item.images.slice(1, 5).map(img => (
                        <img
                            key={img.id}
                            // UPDATE: Use previewUrl (w-1000) for gallery thumbs to be sharp
                            src={img.previewUrl || img.originalUrl}
                            alt="Gallery"
                            style={styles.thumb}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Vehicle Specs & Description ---
export const VehicleInfo = ({ item }: { item: ItemDto }) => (
    <div>
        <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
        <p style={styles.subtitle}>{item.mileage.toLocaleString()} miles • {item.location}</p>

        <div style={styles.specsContainer}>
            <SpecItem label="VIN" value={item.vin} />
            <SpecItem label="Engine" value={item.engine} />
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

    // Images
    imageContainer: { width: "100%", aspectRatio: "16/10", backgroundColor: "#f3f4f6", borderRadius: "4px", overflow: "hidden", position: "relative" as const, marginBottom: "12px" },
    mainImg: { width: "100%", height: "100%", objectFit: "cover" as const },
    placeholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" },
    statusOverlay: { position: "absolute" as const, top: 16, left: 16 },
    thumbGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" },
    thumb: { width: "100%", aspectRatio: "4/3", borderRadius: "2px", objectFit: "cover" as const, backgroundColor: "#eee", cursor: "pointer" },

    // Info
    title: { fontSize: "32px", fontWeight: 700, color: "#111", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
    subtitle: { fontSize: "18px", color: "#555", margin: 0 },
    specsContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px", marginTop: "32px", padding: "24px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" },
    specItem: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    specLabel: { fontSize: "13px", color: "#888", fontWeight: 500, textTransform: "uppercase" as const },
    specValue: { fontSize: "15px", color: "#111", fontWeight: 500 },
    divider: { height: "1px", backgroundColor: "#eee", margin: "40px 0" },
    sectionTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "16px" },
    description: { fontSize: "16px", lineHeight: 1.6, color: "#333", whiteSpace: "pre-wrap" as const },

    // Sidebar
    card: { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", marginBottom: "24px" },
    cardTitle: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: "#999", marginBottom: "16px" },
};