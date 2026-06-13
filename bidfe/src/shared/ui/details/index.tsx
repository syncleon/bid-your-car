import React, { useState } from "react";
import type { ItemDto } from "../../../features/item/types";
import { useStore } from "../../hooks/useStore";

export const DetailPageLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="page-container" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: "var(--text-primary)", transition: "color 0.3s ease" }}>{children}</div>
);

export const DetailHeader = ({ onBack, title }: { onBack: () => void, title?: string }) => (
    <div style={styles.headerRow}>
        <button onClick={onBack} style={minStyles.textBtn}>
            &larr; {title || "Back"}
        </button>
    </div>
);

export const VehicleHeader = ({ item }: { item: ItemDto }) => {
    const handleShare = async () => {
        const shareData = {
            title: `${item.year} ${item.make} ${item.model}`,
            text: `Check out this ${item.year} ${item.make} ${item.model} on BidYourCar!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
                <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
                <p style={styles.subtitle}>{item.mileage.toLocaleString()} km • {item.location}</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={handleShare} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    Share
                </button>
            </div>
        </div>
    );
};

interface GalleryProps {
    item: ItemDto;
    statusLabel?: React.ReactNode;
    onImageClick?: (index: number) => void;
}

export const ImageGallery = ({ item, statusLabel, onImageClick }: GalleryProps) => {
    const images = item.images || [];
    const mainImage = images.find(img => img.category === "MAIN")?.url || images[0]?.url;
    const thumbnails = images.filter(img => img.url !== mainImage).slice(0, 6);
    const remainingCount = Math.max(0, images.length - 7);

    if (!mainImage) {
        return <div style={styles.placeholder}>No Photos Available</div>;
    }

    return (
        <div style={styles.galleryContainer}>
            <div
                style={styles.mainWrapper}
                onClick={() => onImageClick?.(0)}
            >
                <img src={mainImage} alt={item.model} style={styles.mainImg} className="main-img-hover" />
                {statusLabel && <div style={styles.statusOverlay}>{statusLabel}</div>}
                <div style={styles.hoverOverlay}><span>View Fullscreen</span></div>
            </div>

            {thumbnails.length > 0 && (
                <div style={styles.thumbGrid}>
                    {thumbnails.map((img, idx) => {
                        
                        const realIndex = images.findIndex(origImg => origImg.id === img.id);
                        const isLastAndOverflowing = idx === 5 && remainingCount > 0;

                        return (
                            <div
                                key={img.id}
                                style={styles.thumbWrapper}
                                onClick={() => onImageClick?.(realIndex)}
                            >
                                <img src={img.url} alt={`View ${realIndex}`} style={styles.thumbImg} className="thumb-inactive" />
                                {isLastAndOverflowing && (
                                    <div style={styles.moreOverlay}>All Photos ({images.length})</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};



export const VehicleInfo = ({ item, hideHeader = false }: { item: ItemDto, hideHeader?: boolean }) => (
    <div>
        {!hideHeader && (
            <>
                <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
                <p style={styles.subtitle}>{item.mileage.toLocaleString()} miles • {item.location}</p>
            </>
        )}

        {(item.hasServiceHistory || item.isModified) && (
            <div style={styles.tagsContainer}>
                {item.hasServiceHistory && <span style={styles.tag} className="tag-vibrant">Service History</span>}
                {item.isModified && <span style={styles.tag} className="tag-vibrant">Modified</span>}
            </div>
        )}

        <div className="spec-grid-modern">
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

        <h3 style={styles.sectionTitleCB}>Highlights</h3>
        <p style={styles.descriptionCB}>{item.highlights || "No highlights provided."}</p>

        <h3 style={styles.sectionTitleCB}>Known Flaws</h3>
        <p style={styles.descriptionCB}>{item.knownFlaws || "No known flaws provided."}</p>

        <h3 style={styles.sectionTitleCB}>Recent Service History</h3>
        <p style={styles.descriptionCB}>{item.recentServiceHistory || "No recent service history provided."}</p>

        <h3 style={styles.sectionTitleCB}>Other Items Included in Sale</h3>
        <p style={styles.descriptionCB}>{item.otherItemsIncluded || "No other items specified."}</p>

        <h3 style={styles.sectionTitleCB}>Seller Notes</h3>
        <p style={styles.descriptionCB}>{item.description || "No seller notes provided."}</p>
    </div>
);

const SpecItem = ({ label, value }: { label: string, value?: string | null }) => {
    const { toastStore } = useStore();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value || value === "—") return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        toastStore.addToast(`Copied ${label} to clipboard`, "success");
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div 
            className="spec-item-cb" 
            onClick={handleCopy}
            style={{ cursor: value && value !== "—" ? "pointer" : "default" }}
            title={value && value !== "—" ? "Click to copy" : undefined}
        >
            <span className="spec-label-cb">{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                {copied && <span style={{ fontSize: '12px', color: 'var(--color-success-text)', animation: 'fadeIn 0.2s ease' }}>✓</span>}
                <span className="spec-value-cb">{value || "—"}</span>
            </div>
        </div>
    );
};

export const SidebarCard = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div style={styles.card}>
        {title && <div style={styles.cardTitle}>{title}</div>}
        {children}
    </div>
);

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

const minStyles = {
    textBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit", transition: "color 0.3s ease" } as React.CSSProperties,
};

const styles = {
    container: { width: "80%", margin: "0 auto", padding: "16px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: "var(--text-primary)", transition: "color 0.3s ease" },
    headerRow: { marginBottom: 24, display: 'flex', justifyContent: 'space-between' },
    grid: { display: "grid", alignItems: "start" },

    galleryContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px", marginBottom: "24px" },
    mainWrapper: { position: "relative" as const, width: "100%", height: "100%", aspectRatio: "16/10", borderRadius: "8px", overflow: "hidden", cursor: "zoom-in", backgroundColor: "var(--bg-input)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "background-color 0.3s ease" },
    mainImg: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" as const, transition: "transform 0.3s ease", },
    hoverOverlay: { position: "absolute" as const, inset: 0, background: "rgba(0,0,0,0.2)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "14px", pointerEvents: "none" as const, },
    statusOverlay: { position: "absolute" as const, top: 16, left: 16, zIndex: 10 },
    thumbGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "repeat(3, 1fr)", gap: "8px" },
    thumbWrapper: { position: "relative" as const, borderRadius: "8px", overflow: "hidden", cursor: "pointer", backgroundColor: "var(--bg-input)", transition: "background-color 0.3s ease" },
    thumbImg: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" as const, },
    moreOverlay: { position: "absolute" as const, inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600, backdropFilter: "blur(2px)" },
    placeholder: { width: "100%", height: "300px", backgroundColor: "var(--bg-input)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px", transition: "background-color 0.3s ease, color 0.3s ease" },
    title: { fontSize: "36px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0", letterSpacing: "-1px", transition: "color 0.3s ease" },
    subtitle: { fontSize: "18px", color: "var(--text-secondary)", margin: 0, transition: "color 0.3s ease" },
    tagsContainer: { display: "flex", gap: "8px", marginTop: "16px" },
    tag: { padding: "4px 10px", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border-color)", borderRadius: "16px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease" },

    specsContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px", marginTop: "24px", padding: "24px 0", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", transition: "border-color 0.3s ease" },
    specItem: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    specLabel: { fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", transition: "color 0.3s ease" },
    specValue: { fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, letterSpacing: "-0.2px", textAlign: "right" as const, transition: "color 0.3s ease" },
    divider: { height: "1px", backgroundColor: "var(--border-color)", margin: "40px 0", transition: "background-color 0.3s ease" },
    sectionTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)", transition: "color 0.3s ease" },
    description: { fontSize: "16px", lineHeight: 1.6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" as const, transition: "color 0.3s ease" },

    card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "24px", marginBottom: "24px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
    cardTitle: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "16px", transition: "color 0.3s ease" },
    sectionTitleCB: { fontSize: "20px", fontWeight: 700, marginTop: "32px", marginBottom: "16px", color: "var(--text-primary)" },
    descriptionCB: { fontSize: "15px", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" as const },
};

export const DetailSkeleton = () => (
    <DetailPageLayout>
        <DetailHeader onBack={() => {}} title="Loading..." />
        <ResponsiveGrid>
            <div>
                <div style={styles.galleryContainer}>
                    <div style={{...styles.mainWrapper, backgroundColor: "var(--bg-input)"}} className="shimmer" />
                    <div style={styles.thumbGrid}>
                        {Array.from({length: 6}).map((_, i) => (
                            <div key={i} style={{...styles.thumbWrapper, backgroundColor: "var(--bg-input)"}} className="shimmer" />
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ height: 36, width: "60%", backgroundColor: "var(--bg-input)", borderRadius: 6 }} className="shimmer" />
                    <div style={{ height: 20, width: "40%", backgroundColor: "var(--bg-input)", borderRadius: 6 }} className="shimmer" />
                    <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px" }}>
                        {Array.from({length: 10}).map((_, i) => (
                            <div key={i} style={{ height: 24, backgroundColor: "var(--bg-input)", borderRadius: 4 }} className="shimmer" />
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <SidebarCard>
                    <div style={{ height: 20, width: "50%", backgroundColor: "var(--bg-input)", borderRadius: 4, marginBottom: 16 }} className="shimmer" />
                    <div style={{ height: 60, width: "100%", backgroundColor: "var(--bg-input)", borderRadius: 6, marginBottom: 16 }} className="shimmer" />
                    <div style={{ height: 48, width: "100%", backgroundColor: "var(--bg-input)", borderRadius: 6, marginBottom: 12 }} className="shimmer" />
                    <div style={{ height: 48, width: "100%", backgroundColor: "var(--bg-input)", borderRadius: 6 }} className="shimmer" />
                </SidebarCard>
            </div>
        </ResponsiveGrid>
    </DetailPageLayout>
);