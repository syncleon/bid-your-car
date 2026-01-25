import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from "react";
import { Modal } from "../../../shared/ui/Modal";
import type { CreateAuctionDto } from "../types";
import { FormInput } from "../../item/ui/form-ui";
import type { ItemDto } from "../../item/types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAuctionDto) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const CreateAuctionModal = ({ item, isOpen, onClose, onSubmit, isLoading, error }: Props) => {
    const [visibleError, setVisibleError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        startingBid: 0,
        reservePrice: undefined as number | undefined,
        minBidIncrement: 100,
        durationDays: 7,
    });

    useEffect(() => {
        if (error) {
            setVisibleError(error);
            const timer = setTimeout(() => setVisibleError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Calculate the dynamic end date for user preview
    const endDatePreview = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + (formData.durationDays || 0));
        // Add 2 minutes buffer to match the submit logic
        date.setMinutes(date.getMinutes() + 2);
        return date.toLocaleDateString("en-US", {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }, [formData.durationDays]);

    if (!isOpen || !item) return null;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === "" ? undefined : Number(value)
        }));
    };

    const handleDurationSelect = (days: number) => {
        setFormData(prev => ({ ...prev, durationDays: days }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setVisibleError(null);

        const start = new Date(Date.now() + 2 * 60000);
        const end = new Date(start.getTime() + formData.durationDays * 24 * 60 * 60 * 1000);

        const payload: CreateAuctionDto = {
            itemId: item.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            startingBid: formData.startingBid,
            reservePrice: formData.reservePrice || undefined,
            minBidIncrement: formData.minBidIncrement || 100
        };

        await onSubmit(payload);
    };

    const mainImage = item.images?.[0]?.thumbnailUrl;
    const isFormValid = formData.startingBid > 0 && formData.durationDays > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="List Vehicle for Auction">
            <form onSubmit={handleSubmit} style={styles.container}>
                {/* Global Style Injection for Number Inputs */}
                <style>{`
                    input[type=number]::-webkit-inner-spin-button, 
                    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                    input[type=number] { -moz-appearance: textfield; }
                `}</style>

                {visibleError && (
                    <div style={styles.errorBanner}>
                        <div style={styles.errorContent}>
                            <AlertCircleIcon />
                            <span>{visibleError}</span>
                        </div>
                        <button type="button" onClick={() => setVisibleError(null)} style={styles.closeErrorBtn}>
                            <CloseIcon />
                        </button>
                    </div>
                )}

                {/* SECTION 1: VEHICLE PREVIEW */}
                <div style={styles.vehicleCard}>
                    <div style={styles.imageWrapper}>
                        {mainImage ? (
                            <img src={mainImage} alt={item.model} style={styles.img} />
                        ) : (
                            <div style={styles.placeholder}>No Photo</div>
                        )}
                    </div>
                    <div style={styles.infoCol}>
                        <div style={styles.badgeRow}>
                            <span style={styles.yearBadge}>{item.year}</span>
                            <span style={styles.vinBadge}>VIN: {item.vin.slice(-6)}</span>
                        </div>
                        <h3 style={styles.itemTitle}>{item.make} {item.model}</h3>
                    </div>
                </div>

                {/* SECTION 2: PRICING */}
                <div style={styles.sectionHeader}>
                    <DollarIcon /> Pricing Strategy
                </div>
                <div style={styles.grid}>
                    <div style={styles.fieldWrapper}>
                        <div style={styles.inputGroup}>
                            <span style={styles.currencyPrefix}>$</span>
                            <FormInput
                                label="Starting Bid"
                                name="startingBid"
                                type="number"
                                value={formData.startingBid}
                                onChange={handleChange}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div style={styles.helperText}>Opening price for the first bidder.</div>
                    </div>

                    <div style={styles.fieldWrapper}>
                        <div style={styles.inputGroup}>
                            <span style={styles.currencyPrefix}>$</span>
                            <FormInput
                                label="Reserve Price"
                                name="reservePrice"
                                type="number"
                                value={formData.reservePrice ?? ""}
                                onChange={handleChange}
                                placeholder="Optional"
                            />
                        </div>
                        <div style={styles.helperText}>Minimum price to sell (Hidden).</div>
                    </div>
                </div>

                {/* SECTION 3: TIMING */}
                <div style={styles.divider} />
                <div style={styles.sectionHeader}>
                    <ClockIcon /> Auction Duration
                </div>

                <div style={styles.durationContainer}>
                    <div style={styles.pillContainer}>
                        {[3, 5, 7, 14].map(days => (
                            <button
                                key={days}
                                type="button"
                                onClick={() => handleDurationSelect(days)}
                                style={formData.durationDays === days ? styles.pillActive : styles.pill}
                            >
                                {days} Days
                            </button>
                        ))}
                    </div>

                    <div style={styles.grid}>
                        <div style={styles.fieldWrapper}>
                            <FormInput
                                label="Custom Duration (Days)"
                                name="durationDays"
                                type="number"
                                min={1}
                                max={30}
                                value={formData.durationDays}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={styles.fieldWrapper}>
                            <FormInput
                                label="Bid Increment"
                                name="minBidIncrement"
                                type="number"
                                value={formData.minBidIncrement}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* SUMMARY BOX */}
                <div style={styles.summaryBox}>
                    <div style={styles.summaryRow}>
                        <span style={styles.summaryLabel}>Est. End Date:</span>
                        <span style={styles.summaryValue}>{endDatePreview}</span>
                    </div>
                    <div style={styles.summaryRow}>
                        <span style={styles.summaryLabel}>Listing Fee:</span>
                        <span style={styles.summaryValue}>Free</span>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="button" onClick={onClose} disabled={isLoading} style={styles.cancelBtn}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        style={isFormValid ? styles.submitBtn : styles.submitBtnDisabled}
                    >
                        {isLoading ? "Processing..." : `List for $${formData.startingBid}`}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Icons ---
const AlertCircleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);
const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const DollarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

// --- Styles ---
const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: "8px 4px 0 4px",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    sectionHeader: {
        fontSize: "12px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "#555",
        marginBottom: "16px",
        marginTop: "10px",
        display: "flex",
        alignItems: "center"
    },
    vehicleCard: {
        display: "flex",
        gap: "16px",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingBottom: "20px",
        borderBottom: "1px solid #f0f0f0",
        marginBottom: "20px"
    },
    imageWrapper: {
        width: "80px",
        height: "60px",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#eee",
        flexShrink: 0,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    placeholder: {
        height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "10px", color: "#999", fontWeight: 700
    },
    infoCol: { display: "flex", flexDirection: "column", gap: "4px" },
    badgeRow: { display: "flex", gap: "8px", alignItems: "center" },
    itemTitle: { margin: 0, fontSize: "16px", fontWeight: 700, color: "#111" },
    yearBadge: {
        fontSize: "11px", fontWeight: 700, color: "#111", background: "#e0e0e0",
        padding: "2px 6px", borderRadius: "4px"
    },
    vinBadge: { fontSize: "11px", color: "#888", fontFamily: "monospace" },

    divider: { height: "1px", backgroundColor: "#f0f0f0", margin: "24px 0" },

    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "12px" },
    fieldWrapper: { display: "flex", flexDirection: "column" },
    inputGroup: { position: "relative" },
    currencyPrefix: {
        position: "absolute", left: "0", top: "28px", zIndex: 10,
        fontSize: "14px", color: "#999", fontWeight: 500, pointerEvents: "none",
        width: "20px", textAlign: "center" // Adjust based on FormInput padding
    },
    helperText: { fontSize: "11px", color: "#888", marginTop: "4px" },

    durationContainer: { marginBottom: "20px" },
    pillContainer: { display: "flex", gap: "8px", marginBottom: "16px" },
    pill: {
        padding: "6px 12px", borderRadius: "20px", border: "1px solid #ddd",
        background: "#fff", fontSize: "12px", cursor: "pointer", color: "#666",
        transition: "all 0.2s"
    },
    pillActive: {
        padding: "6px 12px", borderRadius: "20px", border: "1px solid #000",
        background: "#000", color: "#fff", fontSize: "12px", cursor: "pointer",
        fontWeight: 600
    },

    summaryBox: {
        background: "#f8f9fa", borderRadius: "8px", padding: "16px",
        marginTop: "10px", border: "1px solid #eee"
    },
    summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" },
    summaryLabel: { color: "#666" },
    summaryValue: { fontWeight: 600, color: "#333" },

    errorBanner: {
        background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B",
        padding: "12px 16px", borderRadius: "8px", fontSize: "13px",
        marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between"
    },
    errorContent: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 },
    closeErrorBtn: { background: "none", border: "none", color: "#991B1B", cursor: "pointer" },

    footer: { marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "16px", borderTop: "1px solid #eee" },
    submitBtn: {
        background: "#111", color: "#fff", border: "none", padding: "10px 24px",
        borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "14px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)", transition: "opacity 0.2s"
    },
    submitBtnDisabled: {
        background: "#ccc", color: "#fff", border: "none", padding: "10px 24px",
        borderRadius: "6px", fontWeight: 600, cursor: "not-allowed", fontSize: "14px"
    },
    cancelBtn: {
        background: "none", border: "none", color: "#666", fontWeight: 500,
        cursor: "pointer", padding: "0 12px", fontSize: "14px"
    }
};