import { useState, useMemo } from "react";
import { Modal } from "../../../shared/ui/Modal";
import type { CreateAuctionDto } from "../types";
import type { ItemDto } from "../../item/types";

// --- Constants ---
// Values are in MINUTES
const DURATION_OPTIONS = [
    { label: "1 Hour", value: 60, desc: "Flash sale" },
    { label: "1 Day", value: 1440, desc: "Urgent" },
    { label: "3 Days", value: 4320, desc: "Quick" },
    { label: "5 Days", value: 7200, desc: "Work week" },
    { label: "1 Week", value: 10080, desc: "Standard" },
    { label: "2 Weeks", value: 20160, desc: "Max reach" },
    { label: "1 Month", value: 43200, desc: "Long term" },
];

const STEPS = [
    { id: 1, title: "Vehicle Review" },
    { id: 2, title: "Bidding Rules" },
    { id: 3, title: "Final Review" },
];

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAuctionDto) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const CreateAuctionModal = ({ item, isOpen, onClose, onSubmit, isLoading, error }: Props) => {
    // State initialization
    const [currentStep, setCurrentStep] = useState(1);

    // Form State
    const [startPrice, setStartPrice] = useState<string>("");
    const [bidIncrement, setBidIncrement] = useState<number>(50);
    const [durationMinutes, setDurationMinutes] = useState<number>(10080); // Default 1 Week

    // UI State
    const [selectedImgIdx, setSelectedImgIdx] = useState(0);

    // --- Computed Values ---
    const durationLabel = DURATION_OPTIONS.find(o => o.value === durationMinutes)?.label || "Custom";

    const projectedEndDate = useMemo(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + durationMinutes);

        if (durationMinutes < 1440) {
            return d.toLocaleTimeString("en-US", { weekday: 'short', hour: 'numeric', minute:'2-digit' });
        }
        return d.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });
    }, [durationMinutes]);

    const images = item?.images || [];
    const mainImage = images.length > 0 && images[selectedImgIdx]
        ? (images[selectedImgIdx].url)
        : null;

    if (!isOpen || !item) return null;

    // --- Validation ---
    const isStep1Valid = true;
    const isStep2Valid = Number(startPrice) > 0 && bidIncrement > 0 && durationMinutes > 0;

    const canProceed = () => {
        switch (currentStep) {
            case 1: return isStep1Valid;
            case 2: return isStep2Valid;
            default: return true;
        }
    };

    // --- Handlers ---
    const handleNext = () => { if (currentStep < STEPS.length) setCurrentStep(c => c + 1); };
    const handleBack = () => { if (currentStep > 1) setCurrentStep(c => c - 1); };

    const handleSubmit = async () => {
        const start = new Date(Date.now() + 60000); // Start ~1 min after approval
        const end = new Date(start.getTime() + (durationMinutes * 60 * 1000));

        const payload: CreateAuctionDto = {
            itemId: item.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            startPrice: Number(startPrice),
            minBidIncrement: bidIncrement
        };
        await onSubmit(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="List Vehicle for Auction">
            <div style={styles.container}>

                {/* Progress Bar */}
                <div style={styles.progressContainer}>
                    <div style={{...styles.progressBar, width: `${(currentStep / STEPS.length) * 100}%`}} />
                </div>
                <div style={styles.stepTitleContainer}>
                    <span style={styles.stepCount}>Step {currentStep} of {STEPS.length}</span>
                    <h2 style={styles.stepHeading}>{STEPS[currentStep - 1].title}</h2>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={styles.errorBanner}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Slider Window */}
                <div style={styles.sliderWindow}>
                    <div style={{
                        ...styles.sliderTrack,
                        width: `${STEPS.length * 100}%`,
                        transform: `translateX(-${(currentStep - 1) * (100 / STEPS.length)}%)`
                    }}>

                        {/* STEP 1: VEHICLE */}
                        <div style={{ ...styles.slide, width: `${100 / STEPS.length}%` }}>
                            <div style={styles.heroImageContainer}>
                                {mainImage ? (
                                    <img src={mainImage} alt="Vehicle" style={styles.heroImg} />
                                ) : (
                                    <div style={styles.placeholderHero}>No Images Available</div>
                                )}
                                <div style={styles.heroOverlay}>
                                    <h3 style={styles.heroTitle}>{item.year} {item.make} {item.model}</h3>
                                    <div style={styles.heroSubtitle}>{item.vin} • {item.mileage.toLocaleString()} mi</div>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div style={styles.thumbStrip}>
                                    {images.slice(0, 5).map((img, i) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setSelectedImgIdx(i)}
                                            style={{
                                                ...styles.thumbBtn,
                                                borderColor: i === selectedImgIdx ? "#2563eb" : "transparent"
                                            }}
                                        >
                                            <img src={img.url} style={styles.thumbImg} alt="" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p style={styles.helperText}>
                                Ensure all details and photos are accurate before proceeding to listing.
                            </p>
                        </div>

                        {/* STEP 2: BIDDING RULES & DURATION */}
                        <div style={{ ...styles.slide, width: `${100 / STEPS.length}%` }}>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Starting Bid</label>
                                <div style={styles.moneyInputWrapper}>
                                    <span style={styles.currency}>$</span>
                                    <input
                                        type="number"
                                        style={styles.moneyInput}
                                        value={startPrice}
                                        onChange={e => setStartPrice(e.target.value)}
                                        placeholder="0"
                                        autoFocus={currentStep === 2}
                                    />
                                </div>
                                <p style={styles.subtext}>The minimum amount required to open the bidding.</p>
                            </div>

                            <div style={{...styles.inputGroup, marginTop: 20}}>
                                <label style={styles.label}>Minimum Bid Increment</label>
                                <div style={styles.moneyInputWrapper}>
                                    <span style={styles.currency}>$</span>
                                    <input
                                        type="number"
                                        value={bidIncrement}
                                        onChange={e => setBidIncrement(Number(e.target.value))}
                                        style={styles.moneyInput}
                                    />
                                </div>
                                <p style={styles.subtext}>How much each subsequent bid must increase by.</p>
                            </div>

                            <div style={{marginTop: 24}}>
                                <label style={styles.label}>Auction Duration</label>
                                <div style={styles.pillContainer}>
                                    {DURATION_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setDurationMinutes(opt.value)}
                                            style={durationMinutes === opt.value ? styles.pillActive : styles.pill}
                                        >
                                            <span style={styles.pillTitle}>{opt.label}</span>
                                            <span style={styles.pillDesc}>{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.infoBox}>
                                📅 <strong>Ends approximately:</strong> {projectedEndDate} <br/>
                                <span style={{fontSize: 12, opacity: 0.8}}>Timer officially starts upon Admin Approval.</span>
                            </div>
                        </div>

                        {/* STEP 3: REVIEW */}
                        <div style={{ ...styles.slide, width: `${100 / STEPS.length}%` }}>
                            <div style={styles.summaryCard}>
                                <SummaryRow label="Vehicle" value={`${item.year} ${item.make} ${item.model}`} />
                                <SummaryRow label="VIN" value={item.vin} />
                                <div style={styles.divider} />
                                <SummaryRow label="Pricing Strategy" value={item.isNoReserve ? "No Reserve" : "Reserve Met"} highlight={item.isNoReserve} />
                                {!item.isNoReserve && (
                                    <SummaryRow label="Reserve Target" value={`$${item.reservePrice?.toLocaleString() || "Not Set"}`} />
                                )}
                                <div style={styles.divider} />
                                <SummaryRow label="Starting Bid" value={`$${Number(startPrice).toLocaleString()}`} />
                                <SummaryRow label="Bid Increment" value={`$${bidIncrement.toLocaleString()}`} />
                                <SummaryRow label="Duration" value={durationLabel} />
                            </div>

                            <p style={styles.disclaimer}>
                                By clicking "Submit", your listing will be queued for admin review.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    {currentStep > 1 ? (
                        <button onClick={handleBack} style={styles.backBtn}>Back</button>
                    ) : <div/>}

                    {currentStep < STEPS.length ? (
                        <button onClick={handleNext} disabled={!canProceed()} style={canProceed() ? styles.nextBtn : styles.disabledBtn}>
                            Continue
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isLoading} style={styles.submitBtn}>
                            {isLoading ? "Submitting..." : "Submit for Approval"}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
            `}</style>
        </Modal>
    );
};

const SummaryRow = ({label, value, highlight}: {label:string, value:string, highlight?: boolean}) => (
    <div style={{display:'flex', justifyContent:'space-between', marginBottom: 8}}>
        <span style={{color: '#6b7280', fontSize: 14}}>{label}</span>
        <span style={{color: highlight ? '#16a34a' : '#111', fontWeight: highlight ? 700 : 600, fontSize: 14}}>{value}</span>
    </div>
);

const styles = {
    container: { fontFamily: "'Inter', sans-serif", color: "#1f2937", padding: "0 4px" },

    // Header
    progressContainer: { height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden", marginBottom: "16px" },
    progressBar: { height: "100%", background: "#111", transition: "width 0.3s ease" },
    stepTitleContainer: { marginBottom: "24px" },
    stepCount: { fontSize: "12px", color: "#6b7280", textTransform: "uppercase" as const, fontWeight: 600, letterSpacing: "0.5px" },
    stepHeading: { fontSize: "24px", fontWeight: 700, margin: "4px 0 0 0", color: "#111" },

    // Slider
    sliderWindow: { overflow: "hidden", width: "100%" },
    sliderTrack: { display: "flex", transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)" },
    slide: { boxSizing: "border-box" as const, padding: "2px" },

    // Step 1: Vehicle
    heroImageContainer: { position: "relative" as const, borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9", background: "#000" },
    heroImg: { width: "100%", height: "100%", objectFit: "cover" as const, opacity: 0.9 },
    heroOverlay: { position: "absolute" as const, bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.8))", padding: "20px", color: "#fff" },
    heroTitle: { margin: 0, fontSize: "20px", fontWeight: 700 },
    heroSubtitle: { fontSize: "13px", opacity: 0.9, marginTop: "4px" },
    placeholderHero: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" },
    thumbStrip: { display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" },
    thumbBtn: { border: "2px solid transparent", padding: 0, borderRadius: "6px", cursor: "pointer", background: "none", transition: "all 0.2s" },
    thumbImg: { width: "48px", height: "36px", objectFit: "cover" as const, borderRadius: "4px" },
    helperText: { fontSize: "13px", color: "#6b7280", marginTop: "20px", lineHeight: 1.5 },

    // Step 2: Bidding Rules
    inputGroup: { marginBottom: "16px" },
    label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" },
    subtext: { fontSize: "12px", color: "#6b7280", marginTop: "6px", fontStyle: "italic" },
    moneyInputWrapper: { display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "8px", padding: "0 12px", height: "48px", background: "#fff" },
    currency: { fontSize: "18px", color: "#9ca3af", fontWeight: 500 },
    moneyInput: { border: "none", fontSize: "18px", fontWeight: 600, width: "100%", outline: "none", marginLeft: "8px", color: "#111" },

    // Duration Pills
    pillContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px" },
    pill: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 4px", cursor: "pointer", textAlign: "center" as const, minHeight: "60px", display:"flex", flexDirection:"column" as const, justifyContent:"center", alignItems:"center", transition: "all 0.2s ease" },
    pillActive: { background: "#fff", border: "2px solid #111", borderRadius: "8px", padding: "11px 3px", cursor: "pointer", textAlign: "center" as const, minHeight: "60px", display:"flex", flexDirection:"column" as const, justifyContent:"center", alignItems:"center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    pillTitle: { display: "block", fontSize: "13px", fontWeight: 600, color: "#111" },
    pillDesc: { display: "block", fontSize: "10px", opacity: 0.8, marginTop: "2px", color: "#6b7280" },
    infoBox: { marginTop: "24px", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#0369a1", lineHeight: 1.5 },

    // Step 3: Review
    summaryCard: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" },
    divider: { height: "1px", background: "#e5e7eb", margin: "12px 0" },
    disclaimer: { fontSize: "12px", color: "#9ca3af", textAlign: "center" as const, marginTop: "20px", lineHeight: 1.4 },

    // Footer
    footer: { display: "flex", justifyContent: "space-between", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid #f0f0f0" },
    backBtn: { background: "none", border: "none", color: "#6b7280", fontWeight: 600, fontSize: "14px", cursor: "pointer" },
    nextBtn: { background: "#111", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer" },
    disabledBtn: { background: "#e5e7eb", color: "#9ca3af", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "not-allowed" },
    submitBtn: { background: "#16a34a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.2)" },
    errorBanner: { background: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }
};