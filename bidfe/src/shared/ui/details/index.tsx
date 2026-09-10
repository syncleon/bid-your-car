import React from "react";
import { format } from "date-fns";
import type { ItemDto } from "../../../features/item/types";

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


export const VehicleHeader = ({ item, auctionEndTime }: { item: ItemDto, auctionEndTime?: string }) => {
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${item.year} ${item.make} ${item.model}`,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div style={styles.headerRow}>
            <div style={{ flex: 1 }}>
                <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
                <p style={styles.subtitle}>
                    {item.mileage.toLocaleString()} miles • {item.location}
                    {auctionEndTime && ` • Auction ends: ${format(new Date(auctionEndTime), "MMMM d, yyyy 'at' h:mm a")}`}
                </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button 
                    onClick={handleShare} 
                    style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        gap: "8px", 
                        backgroundColor: "var(--bg-input)", 
                        color: "var(--text-primary)", 
                        border: "1px solid var(--border-color)", 
                        borderRadius: "8px",
                        padding: "8px 16px", 
                        cursor: "pointer", 
                        fontSize: "14px", 
                        fontWeight: 600,
                        height: "40px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
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
    const thumbnails = images.filter(img => img.url !== mainImage).slice(0, 8);
    const remainingCount = Math.max(0, images.length - 9);

    if (!mainImage) {
        return <div style={styles.placeholder}>No Photos Available</div>;
    }

    return (
        <div className={`gallery-container-new ${thumbnails.length === 0 ? 'no-thumbs' : ''}`}>
            <div
                style={styles.mainWrapper}
                onClick={() => onImageClick?.(0)}
            >
                <img src={mainImage} alt={item.model} style={styles.mainImg} className="main-img-hover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/600x400/eeeeee/999999?text=Image+Not+Found'; }} />
                {statusLabel && <div style={styles.statusOverlay}>{statusLabel}</div>}
                <div style={styles.hoverOverlay}><span>View Fullscreen</span></div>
            </div>

            {thumbnails.length > 0 && (
                <div className="thumb-grid-new">
                    {thumbnails.map((img, idx) => {
                        
                        const realIndex = images.findIndex(origImg => origImg.id === img.id);
                        const isLastAndOverflowing = idx === 7 && remainingCount > 0;

                        return (
                            <div
                                key={img.id}
                                style={styles.thumbWrapper}
                                onClick={() => onImageClick?.(realIndex)}
                            >
                                <img src={img.url} alt={`View ${realIndex}`} style={styles.thumbImg} className="thumb-inactive" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/150x150/eeeeee/999999?text=X'; }} />
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



export const VehicleInfo = ({ item, hideHeader = false }: { item: ItemDto, hideHeader?: boolean }) => {
    return (
        <div className="vehicle-info-editorial">
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

            <div className="spec-table-container">
                <div className="spec-column spec-column-left">
                    <SpecRow label="Make" value={item.make} />
                    <SpecRow label="Model" value={item.model} />
                    <SpecRow label="Mileage" value={item.mileage.toLocaleString()} />
                    <SpecRow label="VIN" value={item.vin} />
                    <SpecRow label="Title Status" value={item.titleStatus || "Clean"} />
                    <SpecRow label="Location" value={item.location} />
                    <SpecRow 
                        label="Seller" 
                        value={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {item.seller?.profilePhotoUrl ? (
                                    <img src={item.seller.profilePhotoUrl} alt="Seller" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-input)' }} />
                                )}
                                <span>{item.seller?.username || "Unknown"}</span>
                                <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Contact</span>
                            </div>
                        } 
                    />
                </div>
                <div className="spec-column spec-column-right">
                    <SpecRow label="Engine" value={item.engine} />
                    <SpecRow label="Drivetrain" value={item.drivetrain} />
                    <SpecRow label="Transmission" value={item.transmission} />
                    <SpecRow label="Body Style" value={item.bodyStyle} />
                    <SpecRow label="Exterior Color" value={item.exteriorColor} />
                    <SpecRow label="Interior Color" value={item.interiorColor} />
                    <SpecRow label="Seller Type" value={item.sellerType || "Private Party"} />
                </div>
            </div>

            {/* Highlights — only if content */}
            {item.highlights && (
                <section className="info-section">
                    <h3 className="info-section-heading">Highlights</h3>
                    <p className="info-section-body">{item.highlights}</p>
                </section>
            )}

            {/* Known Flaws — only if content */}
            {item.knownFlaws && (
                <section className="info-section info-section-warning">
                    <h3 className="info-section-heading">Known Flaws</h3>
                    <p className="info-section-body">{item.knownFlaws}</p>
                </section>
            )}

            {/* Service History — only if content */}
            {item.recentServiceHistory && (
                <section className="info-section">
                    <h3 className="info-section-heading">Recent Service History</h3>
                    <p className="info-section-body">{item.recentServiceHistory}</p>
                </section>
            )}

            {/* Other Items — only if content */}
            {item.otherItemsIncluded && (
                <section className="info-section">
                    <h3 className="info-section-heading">Other Items Included</h3>
                    <p className="info-section-body">{item.otherItemsIncluded}</p>
                </section>
            )}

            {/* Seller Notes — only if content */}
            {item.description && (
                <section className="info-section">
                    <h3 className="info-section-heading">Seller Notes</h3>
                    <p className="info-section-body">{item.description}</p>
                </section>
            )}
        </div>
    );
};

const SpecRow = ({ label, value }: { label: string, value?: React.ReactNode }) => {
    return (
        <div className="spec-row-new">
            <div className="spec-row-label-new">{label}</div>
            <div className="spec-row-value-new">
                {value || "—"}
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
            gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
            gap: isMobile ? "32px" : "48px"
        }}>
            {children}
        </div>
    );
};

const minStyles = {
    textBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit", transition: "color 0.3s ease" } as React.CSSProperties,
};

const styles = {
    container: { width: "92%", margin: "0 auto", padding: "16px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: "var(--text-primary)", transition: "color 0.3s ease" },
    headerRow: { marginBottom: 16, display: 'flex', justifyContent: 'space-between' },
    grid: { display: "grid", alignItems: "start" },

    galleryContainer: { display: "grid", gridTemplateColumns: "70fr 30fr", gap: "8px", margin: 0, padding: 0 },
    mainWrapper: { position: "relative" as const, width: "100%", height: "100%", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", cursor: "zoom-in", backgroundColor: "var(--bg-input)", padding: 0, margin: 0 },
    mainImg: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" as const, transition: "transform 0.3s ease", display: "block" },
    hoverOverlay: { position: "absolute" as const, inset: 0, background: "rgba(249, 115, 22, 0.15)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "14px", pointerEvents: "none" as const, backdropFilter: "blur(2px)" },
    statusOverlay: { position: "absolute" as const, top: 16, left: 16, zIndex: 10 },
    thumbGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: 0, margin: 0 },
    thumbWrapper: { position: "relative" as const, aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", cursor: "pointer", backgroundColor: "var(--bg-input)", padding: 0, margin: 0 },
    thumbImg: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
    moreOverlay: { position: "absolute" as const, inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600, backdropFilter: "blur(2px)", borderRadius: "8px" },
    placeholder: { width: "100%", height: "300px", backgroundColor: "var(--bg-input)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px", transition: "background-color 0.3s ease, color 0.3s ease" },
    title: { fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0", letterSpacing: "-0.03em", lineHeight: 1.1 },
    subtitle: { fontSize: "15px", color: "#9ca3af", margin: 0, fontWeight: 500, letterSpacing: "0.01em" },
    tagsContainer: { display: "flex", gap: "8px", marginTop: "16px" },
    tag: { padding: "4px 10px", backgroundColor: "rgba(249, 115, 22, 0.1)", border: "1px solid var(--border-color)", borderRadius: "16px", fontSize: "12px", fontWeight: 600, color: "var(--color-primary)", transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease" },

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
                <div className="gallery-container-new">
                    <div style={{...styles.mainWrapper, backgroundColor: "var(--bg-input)"}} className="shimmer" />
                    <div className="thumb-grid-new">
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