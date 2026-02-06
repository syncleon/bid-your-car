import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Modal } from "../../../shared/ui/Modal";
import type { CreateAuctionDto } from "../types";
import type { ItemDto } from "../../item/types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAuctionDto) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

// Duration options in minutes (calculated for logic)
const DURATION_OPTIONS = [
    { label: "1 Min (Test)", value: 1 / (24 * 60) }, // 1 minute as fraction of day
    { label: "3 Days", value: 3 },
    { label: "5 Days", value: 5 },
    { label: "7 Days", value: 7 },
];

export const CreateAuctionModal = ({ item, isOpen, onClose, onSubmit, isLoading, error }: Props) => {
    const [visibleError, setVisibleError] = useState<string | null>(null);

    // Form State
    const [startPrice, setStartPrice] = useState<string>("");
    const [reservePrice, setReservePrice] = useState<string>("");
    const [hasReserve, setHasReserve] = useState(false);
    const [durationDays, setDurationDays] = useState<number>(7); // Default 7 days
    const [bidIncrement, setBidIncrement] = useState<number>(100);

    // Reset when opening new item
    useEffect(() => {
        if (isOpen) {
            setStartPrice("");
            setReservePrice("");
            setHasReserve(false);
            setDurationDays(7);
            setBidIncrement(100);
            setVisibleError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (error) {
            setVisibleError(error);
            const timer = setTimeout(() => setVisibleError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Derived: End Date Preview
    const endDatePreview = useMemo(() => {
        const now = new Date();
        // Add duration (days * 24h * 60m * 60s * 1000ms)
        const durationMs = durationDays * 24 * 60 * 60 * 1000;
        const end = new Date(now.getTime() + durationMs + (2 * 60000)); // +2 min buffer logic

        // Format relative time if < 24h (e.g., "Today at 5:00 PM")
        if (durationDays < 1) {
            return `Today, ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
        }

        return end.toLocaleDateString("en-US", {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    }, [durationDays]);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setVisibleError(null);

        const start = new Date(Date.now() + 60000); // Start in 1 min (buffer)
        const end = new Date(start.getTime() + (durationDays * 24 * 60 * 60 * 1000));

        const payload: CreateAuctionDto = {
            itemId: item.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            startingBid: Number(startPrice),
            reservePrice: hasReserve && reservePrice ? Number(reservePrice) : undefined,
            minBidIncrement: bidIncrement
        };

        await onSubmit(payload);
    };

    const mainImage = item.images?.[0]?.thumbnailUrl;
    const isFormValid = Number(startPrice) > 0 && durationDays > 0;
    const listingFee = hasReserve ? "$99.00" : "Free"; // Mock fee logic like real apps

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="List Vehicle">
            <form onSubmit={handleSubmit} style={styles.container}>
                <style>{`
                    input[type=number]::-webkit-inner-spin-button, 
                    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                    input[type=number] { -moz-appearance: textfield; }
                `}</style>

                {visibleError && (
                    <div style={styles.errorBanner}>
                        <div style={styles.errorContent}>
                            <AlertCircleIcon /> <span>{visibleError}</span>
                        </div>
                        <button type="button" onClick={() => setVisibleError(null)} style={styles.closeErrorBtn}><CloseIcon /></button>
                    </div>
                )}

                {/* 1. Vehicle Identity Card */}
                <div style={styles.vehicleCard}>
                    <div style={styles.imageWrapper}>
                        {mainImage ? <img src={mainImage} alt={item.model} style={styles.img} /> : <div style={styles.placeholder}>No Photo</div>}
                    </div>
                    <div>
                        <div style={styles.vinBadge}>VIN: {item.vin}</div>
                        <h3 style={styles.itemTitle}>{item.year} {item.make} {item.model}</h3>
                        <div style={styles.mileage}>{item.mileage.toLocaleString()} Miles</div>
                    </div>
                </div>

                <div style={styles.scrollArea}>

                    {/* 2. Pricing Section */}
                    <SectionTitle icon={<DollarIcon />} title="Pricing Strategy" />

                    <div style={styles.fieldRow}>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Starting Bid</label>
                            <div style={styles.inputGroup}>
                                <span style={styles.prefix}>$</span>
                                <input
                                    type="number"
                                    value={startPrice}
                                    onChange={e => setStartPrice(e.target.value)}
                                    style={styles.input}
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{flex: 1}}>
                            <label style={styles.label}>
                                Reserve Price
                                <span style={styles.optionalLabel}>(Optional)</span>
                            </label>
                            {hasReserve ? (
                                <div style={styles.inputGroup}>
                                    <span style={styles.prefix}>$</span>
                                    <input
                                        type="number"
                                        value={reservePrice}
                                        onChange={e => setReservePrice(e.target.value)}
                                        style={styles.input}
                                        placeholder="Min sale price"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setHasReserve(false)} style={styles.removeBtn}>✕</button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setHasReserve(true)} style={styles.addReserveBtn}>
                                    + Add Reserve Price
                                </button>
                            )}
                        </div>
                    </div>

                    <p style={styles.helperText}>
                        {hasReserve
                            ? "A listing fee of $99 applies for reserve auctions."
                            : "No Reserve auctions attract 40% more bidders on average."}
                    </p>

                    <div style={styles.divider} />

                    {/* 3. Duration Section */}
                    <SectionTitle icon={<ClockIcon />} title="Auction Duration" />

                    <div style={styles.pillContainer}>
                        {DURATION_OPTIONS.map(opt => (
                            <button
                                key={opt.label}
                                type="button"
                                onClick={() => setDurationDays(opt.value)}
                                style={Math.abs(durationDays - opt.value) < 0.001 ? styles.pillActive : styles.pill}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div style={{marginTop: 12}}>
                        <label style={styles.label}>Minimum Bid Increment</label>
                        <div style={styles.inputGroupSimple}>
                            <span style={styles.prefixSimple}>$</span>
                            <input
                                type="number"
                                value={bidIncrement}
                                onChange={e => setBidIncrement(Number(e.target.value))}
                                style={styles.inputSimple}
                            />
                        </div>
                    </div>

                </div>

                {/* 4. Footer Summary */}
                <div style={styles.footer}>
                    <div style={styles.summaryBox}>
                        <div style={styles.summaryItem}>
                            <div style={styles.summaryLabel}>Ends</div>
                            <div style={styles.summaryValue}>{endDatePreview}</div>
                        </div>
                        <div style={styles.summaryItem}>
                            <div style={styles.summaryLabel}>Fee</div>
                            <div style={styles.summaryValue}>{listingFee}</div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        style={isFormValid ? styles.submitBtn : styles.submitBtnDisabled}
                    >
                        {isLoading ? "Publishing..." : "Launch Auction"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Components ---
const SectionTitle = ({icon, title}: {icon: any, title: string}) => (
    <div style={styles.sectionHeader}>
        {icon} <span style={{marginLeft: 8}}>{title}</span>
    </div>
);

// --- Icons ---
const AlertCircleIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>);
const CloseIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const DollarIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
const ClockIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);

// --- Styles ---
const styles = {
    container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },

    // Vehicle Card
    vehicleCard: { display: "flex", gap: "16px", padding: "0 0 20px", borderBottom: "1px solid #f0f0f0", marginBottom: "20px" },
    imageWrapper: { width: "70px", height: "50px", borderRadius: "6px", overflow: "hidden", background: "#f3f4f6", flexShrink: 0 },
    img: { width: "100%", height: "100%", objectFit: "cover" as const },
    placeholder: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#999" },
    vinBadge: { fontSize: "11px", color: "#6b7280", fontFamily: "monospace", letterSpacing: "0.5px", marginBottom: "2px" },
    itemTitle: { margin: 0, fontSize: "15px", fontWeight: 700, color: "#111", lineHeight: 1.2 },
    mileage: { fontSize: "12px", color: "#666", marginTop: "2px" },

    // Layout
    scrollArea: { paddingBottom: "10px" },
    fieldRow: { display: "flex", gap: "20px", marginBottom: "8px" },
    divider: { height: "1px", backgroundColor: "#f0f0f0", margin: "24px 0" },

    // Headers
    sectionHeader: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", color: "#9ca3af", marginBottom: "16px", display: "flex", alignItems: "center" },

    // Inputs
    label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" },
    optionalLabel: { fontSize: "11px", fontWeight: 400, color: "#9ca3af", marginLeft: "4px" },

    inputGroup: { position: "relative" as const, display: "flex", alignItems: "center" },
    prefix: { position: "absolute" as const, left: "12px", color: "#9ca3af", fontSize: "14px", fontWeight: 500, pointerEvents: "none" as const },
    input: { width: "100%", height: "40px", padding: "0 12px 0 26px", fontSize: "15px", fontWeight: 500, color: "#111", border: "1px solid #e5e7eb", borderRadius: "6px", outline: "none", transition: "border 0.2s" },

    // Reserve Logic
    addReserveBtn: { width: "100%", height: "40px", border: "1px dashed #d1d5db", borderRadius: "6px", background: "#f9fafb", color: "#6b7280", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
    removeBtn: { position: "absolute" as const, right: "8px", background: "none", border: "none", color: "#9ca3af", fontSize: "14px", cursor: "pointer", padding: "4px" },
    helperText: { fontSize: "11px", color: "#6b7280", marginTop: "8px", lineHeight: 1.4 },

    // Duration Pills
    pillContainer: { display: "flex", gap: "8px", flexWrap: "wrap" as const },
    pill: { padding: "8px 14px", borderRadius: "20px", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
    pillActive: { padding: "8px 14px", borderRadius: "20px", border: "1px solid #111", background: "#111", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },

    // Simple Input (Increment)
    inputGroupSimple: { position: "relative" as const, maxWidth: "150px" },
    prefixSimple: { position: "absolute" as const, left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: "13px" },
    inputSimple: { width: "100%", height: "36px", padding: "0 10px 0 22px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "13px", fontWeight: 500 },

    // Footer
    footer: { marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" },
    summaryBox: { display: "flex", gap: "24px" },
    summaryItem: { display: "flex", flexDirection: "column" as const, gap: "2px" },
    summaryLabel: { fontSize: "10px", textTransform: "uppercase" as const, color: "#9ca3af", fontWeight: 700 },
    summaryValue: { fontSize: "13px", fontWeight: 600, color: "#111" },

    submitBtn: { height: "40px", padding: "0 24px", background: "#111", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 6px -2px rgba(0,0,0,0.1)" },
    submitBtnDisabled: { height: "40px", padding: "0 24px", background: "#e5e7eb", color: "#a1a1aa", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "14px", cursor: "not-allowed" },

    // Error
    errorBanner: { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    errorContent: { display: "flex", alignItems: "center", gap: "8px" },
    closeErrorBtn: { background: "none", border: "none", cursor: "pointer", color: "#991b1b", padding: 0 }
};