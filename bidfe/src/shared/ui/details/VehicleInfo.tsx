import { format } from "date-fns";
import type { ItemDto } from "../../../features/item/types";
import { styles } from "./sharedStyles";

export const VehicleHeader = ({ item }: { item: ItemDto }) => {
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
                    {[item.engine, item.transmission, item.drivetrain, item.fuelType, item.exteriorColor, `${item.mileage.toLocaleString()} miles`, item.location].filter(Boolean).join(", ")}
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
                        borderRadius: "0",
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

export const VehicleInfo = ({ item, hideHeader = false, isNoReserve }: { item: ItemDto, hideHeader?: boolean, isNoReserve?: boolean }) => {
    const showNoReserve = isNoReserve || item.auction?.isNoReserve;
    return (
        <div className="vehicle-info" style={{ width: "100%" }}>
            {!hideHeader && (
                <div style={{ marginBottom: "24px" }}>
                    <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
                    <p style={styles.subtitle}>{item.mileage.toLocaleString()} miles • {item.location}</p>
                </div>
            )}

            {(item.hasServiceHistory || item.isModified || showNoReserve) && (
                <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                    {showNoReserve && <span className="vehicle-tag tag-no-reserve">No Reserve</span>}
                    {item.hasServiceHistory && <span className="vehicle-tag tag-service-history">Service History</span>}
                    {item.isModified && <span className="vehicle-tag tag-modified">Modified</span>}
                </div>
            )}

            <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "48px" }}>
                
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "3px",
                    backgroundColor: "var(--bg-card)",
                }}>
                    {/* Seller Notes */}
                    {item.description && (
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
                            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--text-primary)" }}>Seller Notes</h2>
                            <div className="info-body" style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{item.description}</div>
                        </div>
                    )}

                    {/* Spec Table */}
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                    }}>
                    {/* Left Column wrapper */}
                    <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
                        {[
                            { label: 'Make', value: <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>{item.make}</span> },
                            { label: 'Model', value: <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>{item.model}</span> },
                            { label: 'Mileage', value: item.mileage.toLocaleString() },
                            { label: 'VIN', value: item.vin },
                            { label: 'Title Status', value: item.titleStatus || "Clean" },
                            { label: 'Location', value: <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>{item.location}</span> },
                            { label: 'Seller', value: (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '10px' }}>
                                        {(item.seller?.username || "S")[0].toUpperCase()}
                                    </div>
                                    <strong style={{ color: 'var(--text-primary)' }}>{item.seller?.username || "Unknown"}</strong>
                                    <button style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Contact</button>
                                </div>
                            ) }
                        ].map((row, i, arr) => (
                            <div key={row.label} style={{ display: 'flex', padding: '10px 16px', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                <div style={{ width: '120px', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, fontSize: '14px' }}>{row.label}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{row.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column wrapper */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[
                            { label: 'Engine', value: item.engine },
                            { label: 'Drivetrain', value: item.drivetrain },
                            { label: 'Transmission', value: item.transmission },
                            { label: 'Body Style', value: item.bodyStyle },
                            { label: 'Exterior Color', value: item.exteriorColor },
                            { label: 'Interior Color', value: item.interiorColor },
                            { label: 'Seller Type', value: item.sellerType || "Private Party" }
                        ].map((row, i, arr) => (
                            <div key={row.label} style={{ display: 'flex', padding: '10px 16px', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                <div style={{ width: '120px', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, fontSize: '14px' }}>{row.label}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
                </div>

                {/* Highlights */}
                {item.highlights && (
                    <section className="info-section">
                        <h2 className="info-heading">Highlights</h2>
                        <div className="info-body">{item.highlights}</div>
                    </section>
                )}

                {/* Known Flaws */}
                {item.knownFlaws && (
                    <section className="info-section">
                        <h2 className="info-heading" style={{ color: "#ef4444" }}>Known Flaws</h2>
                        <div className="info-body">{item.knownFlaws}</div>
                    </section>
                )}

                {/* Recent Service History */}
                {item.recentServiceHistory && (
                    <section className="info-section">
                        <h2 className="info-heading">Recent Service History</h2>
                        <div className="info-body">{item.recentServiceHistory}</div>
                    </section>
                )}

                {/* Other Items Included */}
                {item.otherItemsIncluded && (
                    <section className="info-section">
                        <h2 className="info-heading">Other Items Included</h2>
                        <div className="info-body">{item.otherItemsIncluded}</div>
                    </section>
                )}

            </div>
        </div>
    );
};
