import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { Modal } from "../../../shared/ui/Modal";
import type { CreateAuctionDto } from "../types";
import type { ItemDto } from "../../item/types";

const DURATION_OPTIONS = [
    { label: "1 Hour (Flash sale)", value: 60 },
    { label: "1 Day (Urgent)", value: 1440 },
    { label: "3 Days (Quick)", value: 4320 },
    { label: "5 Days (Work week)", value: 7200 },
    { label: "1 Week (Standard)", value: 10080 },
    { label: "2 Weeks (Max reach)", value: 20160 },
    { label: "1 Month (Long term)", value: 43200 },
] as const;

type StartMode = "ASAP_AFTER_APPROVAL" | "SCHEDULED";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAuctionDto) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const MIN_SCHEDULE_OFFSET_MS = 30_000; 
const ASAP_PREVIEW_OFFSET_MS = 60_000; 

const toLocalDateTimeInputValue = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
};

const parseLocalDateTime = (value: string): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const CreateAuctionModal = ({
    item,
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    error
}: Props) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [startPrice, setStartPrice] = useState("");
    const [isNoReserve, setIsNoReserve] = useState<boolean>(true);
    const [reservePrice, setReservePrice] = useState("");

    const [durationMinutes, setDurationMinutes] = useState<number>(10080);
    const [startMode, setStartMode] = useState<StartMode>("ASAP_AFTER_APPROVAL");
    const [scheduledStartLocal, setScheduledStartLocal] = useState<string>(() => {
        const defaultStart = new Date(Date.now() + 60 * 60 * 1000);
        defaultStart.setSeconds(0, 0);
        return toLocalDateTimeInputValue(defaultStart);
    });

    useEffect(() => {
        if (!isOpen) return;
        queueMicrotask(() => {
            setCurrentStep(1);
            setStartPrice("");
            setIsNoReserve(true);
            setReservePrice("");
            setDurationMinutes(10080);
            setStartMode("ASAP_AFTER_APPROVAL");
            const resetStart = new Date(Date.now() + 60 * 60 * 1000);
            resetStart.setSeconds(0, 0);
            setScheduledStartLocal(toLocalDateTimeInputValue(resetStart));
        });
    }, [isOpen, item?.id]);

    const scheduledStartDate = useMemo(() => parseLocalDateTime(scheduledStartLocal), [scheduledStartLocal]);
    const [nowMs] = useState(() => Date.now());
    const minAllowedScheduledStartMs = nowMs + MIN_SCHEDULE_OFFSET_MS;
    const scheduledStartMs = scheduledStartDate?.getTime() ?? null;

    const isScheduledStartValid =
        startMode === "ASAP_AFTER_APPROVAL" ||
        (scheduledStartMs !== null && scheduledStartMs > minAllowedScheduledStartMs);

    const scheduledStartError = useMemo(() => {
        if (startMode !== "SCHEDULED") return null;
        if (!scheduledStartDate) return "Please select a valid start date/time.";
        if (scheduledStartDate.getTime() <= minAllowedScheduledStartMs) {
            return "Start time must be at least 30 seconds in the future.";
        }
        return null;
    }, [startMode, scheduledStartDate, minAllowedScheduledStartMs]);

    if (!isOpen || !item) return null;

    const startPriceNum = Number(startPrice);
    const isStartPriceValid = Number.isFinite(startPriceNum) && startPriceNum > 0 && startPriceNum <= 100_000_000;
    const reservePriceNum = Number(reservePrice);
    const isReserveValid = isNoReserve || (!isNoReserve && Number.isFinite(reservePriceNum) && reservePriceNum > startPriceNum && reservePriceNum <= 100_000_000);

    const canProceedStep1 = isStartPriceValid && isReserveValid;
    const canProceedStep2 = isScheduledStartValid;
    const canProceedStep3 = true;

    const handleNext = () => {
        if (currentStep === 1 && canProceedStep1) setCurrentStep(2);
        else if (currentStep === 2 && canProceedStep2) setCurrentStep(3);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (currentStep < 3) {
            handleNext();
            return;
        }

        if (!canProceedStep1 || !canProceedStep2 || !canProceedStep3) return;

        let start: Date;
        if (startMode === "SCHEDULED") {
            const parsed = parseLocalDateTime(scheduledStartLocal);
            if (!parsed || parsed.getTime() <= Date.now() + MIN_SCHEDULE_OFFSET_MS) return;
            start = parsed;
        } else {
            start = new Date(Date.now() + ASAP_PREVIEW_OFFSET_MS);
        }

        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

        const payload: CreateAuctionDto = {
            itemId: item.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            startPrice: startPriceNum,
            isNoReserve: isNoReserve,
            reservePrice: isNoReserve ? null : reservePriceNum,
        };

        await onSubmit(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="List for Auction">
            <form onSubmit={handleSubmit} style={{ padding: "0 4px" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "32px" }}>
                    {[1, 2, 3].map((step) => {
                        let isClickable = false;
                        if (step < currentStep) isClickable = true;
                        if (step === 1) isClickable = true;
                        if (step === 2 && canProceedStep1) isClickable = true;
                        if (step === 3 && canProceedStep1 && canProceedStep2) isClickable = true;

                        return (
                            <div
                                key={step}
                                onClick={() => isClickable && setCurrentStep(step)}
                                style={{
                                    width: "48px",
                                    height: "6px",
                                    borderRadius: "6px",
                                    background: step <= currentStep ? "var(--color-primary)" : "var(--border-color)",
                                    opacity: step === currentStep ? 1 : 0.4,
                                    cursor: isClickable ? "pointer" : "not-allowed",
                                    transition: "all 0.3s ease"
                                }}
                            />
                        );
                    })}
                </div>

                {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

                <div style={{ minHeight: "380px", animation: "fadeIn 0.2s ease-out" }}>
                    {currentStep === 1 && (
                        <div>
                            <h3 style={{ marginBottom: "8px", fontSize: "20px", fontWeight: 600 }}>Set Your Pricing Strategy</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px", lineHeight: 1.5 }}>
                                Start strong by setting your opening bid. Choose whether to let the market decide the final price, or protect your investment with a hidden minimum reserve.
                            </p>

                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="form-label" style={{ display: "block", marginBottom: "8px" }}>Starting Bid ($)</label>
                                <div style={styles.inputWrapper}>
                                    <span style={styles.inputPrefix}>$</span>
                                    <input
                                        type="number"
                                        className="auction-input"
                                        style={styles.largeInput}
                                        value={startPrice}
                                        onChange={(e) => setStartPrice(e.target.value)}
                                        placeholder="0"
                                        min={1}
                                        max={100000000}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="form-label" style={{ display: "block", marginBottom: "12px" }}>Reserve Strategy</label>
                                <div style={styles.cardContainer}>
                                    <div 
                                        style={isNoReserve ? styles.cardActive : styles.card}
                                        onClick={() => setIsNoReserve(true)}
                                    >
                                        <div style={styles.cardTitle}>No Reserve</div>
                                        <div style={styles.cardDesc}>Guaranteed to sell. Generates maximum excitement and bidding wars.</div>
                                    </div>
                                    <div 
                                        style={!isNoReserve ? styles.cardActive : styles.card}
                                        onClick={() => setIsNoReserve(false)}
                                    >
                                        <div style={styles.cardTitle}>Set Reserve</div>
                                        <div style={styles.cardDesc}>Protect your investment. The item won't sell unless the reserve is met.</div>
                                    </div>
                                </div>
                            </div>

                            {!isNoReserve && (
                                <div className="form-group" style={{ marginBottom: 24, marginTop: 8, animation: 'fadeIn 0.2s ease-out' }}>
                                    <label className="form-label" style={{ display: "block", marginBottom: "8px" }}>Reserve Price ($)</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputPrefix}>$</span>
                                        <input
                                            type="number"
                                            className="auction-input"
                                            style={styles.largeInput}
                                            value={reservePrice}
                                            onChange={(e) => setReservePrice(e.target.value)}
                                            placeholder="Min acceptable price"
                                            min={1}
                                            max={100000000}
                                            required
                                        />
                                    </div>
                                    {!isNoReserve && reservePrice !== "" && reservePriceNum <= startPriceNum && (
                                        <div className="form-error-text" style={{ marginTop: "8px", color: "var(--color-danger)", fontSize: "13px" }}>
                                            Reserve price must be greater than the starting bid.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h3 style={{ marginBottom: "8px", fontSize: "20px", fontWeight: 600 }}>When Should We Go Live?</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px", lineHeight: 1.5 }}>
                                Launch immediately upon approval to catch eager buyers right away, or strategically schedule your drop for a future date to build hype and anticipation.
                            </p>

                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="form-label" style={{ display: "block", marginBottom: "12px" }}>Start Time</label>
                                <div style={styles.segmentedControl}>
                                    <div
                                        style={startMode === "ASAP_AFTER_APPROVAL" ? styles.segmentActive : styles.segmentInactive}
                                        onClick={() => setStartMode("ASAP_AFTER_APPROVAL")}
                                    >
                                        Launch ASAP
                                    </div>
                                    <div
                                        style={startMode === "SCHEDULED" ? styles.segmentActive : styles.segmentInactive}
                                        onClick={() => setStartMode("SCHEDULED")}
                                    >
                                        Schedule Drop
                                    </div>
                                </div>
                                {startMode === "SCHEDULED" && (
                                    <div style={{ marginTop: 24, animation: 'fadeIn 0.2s ease-out' }}>
                                        <label className="form-label" style={{ display: "block", marginBottom: "8px" }}>Select Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-input"
                                            style={{ padding: "16px", fontSize: "16px", border: "none", background: "var(--bg-input)", width: "100%", boxSizing: "border-box" }}
                                            value={scheduledStartLocal}
                                            onChange={(e) => setScheduledStartLocal(e.target.value)}
                                            required
                                        />
                                        {scheduledStartError && <div className="form-error-text" style={{ marginTop: "8px" }}>{scheduledStartError}</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <h3 style={{ marginBottom: "8px", fontSize: "20px", fontWeight: 600 }}>Choose Your Auction Window</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px", lineHeight: 1.5 }}>
                                How long should the bidding last? A shorter window drives high urgency and "FOMO", while a longer window maximizes your exposure to potential buyers.
                            </p>

                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <div style={styles.pillGrid}>
                                    {DURATION_OPTIONS.map((opt) => (
                                        <div
                                            key={opt.value}
                                            style={durationMinutes === opt.value ? styles.durationActive : styles.durationInactive}
                                            onClick={() => setDurationMinutes(opt.value)}
                                        >
                                            {opt.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-actions" style={{ display: "flex", gap: "16px", justifyContent: "space-between", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
                    <button type="button" style={styles.btnCancel} onClick={currentStep === 1 ? onClose : handleBack} disabled={isLoading}>
                        {currentStep === 1 ? "Cancel" : "Back"}
                    </button>
                    <button type="submit" style={styles.btnSubmit} disabled={isLoading || (currentStep === 1 && !canProceedStep1) || (currentStep === 2 && !canProceedStep2)}>
                        {currentStep === 3 ? (isLoading ? "Submitting..." : "Submit for Approval") : "Next"}
                    </button>
                </div>
            </form>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .auction-input:focus {
                    outline: none !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .form-actions button {
                    border-radius: 0 !important;
                }
            `}</style>
        </Modal>
    );
};

const styles: Record<string, CSSProperties> = {
    inputWrapper: {
        display: "flex",
        alignItems: "center",
        border: "none",
        borderRadius: "6px",
        padding: "0 16px",
        height: "54px",
        background: "var(--bg-input)",
        transition: "background-color 0.2s ease",
    },
    inputPrefix: {
        color: "var(--text-muted)",
        fontSize: "20px",
        fontWeight: 500,
        marginRight: "12px",
    },
    largeInput: {
        border: "none",
        background: "transparent",
        color: "var(--text-primary)",
        fontSize: "20px",
        fontWeight: 600,
        width: "100%",
        outline: "none",
    },
    cardContainer: {
        display: "flex",
        gap: "16px",
    },
    card: {
        flex: 1,
        border: "1px solid var(--border-color)",
        borderRadius: "6px",
        padding: "16px",
        cursor: "pointer",
        background: "var(--bg-card)",
        transition: "all 0.2s ease",
    },
    cardActive: {
        flex: 1,
        border: "1px solid var(--color-primary)",
        borderRadius: "6px",
        padding: "16px",
        cursor: "pointer",
        background: "var(--bg-hover)",
        transition: "all 0.2s ease",
    },
    cardTitle: {
        fontWeight: 600,
        fontSize: "15px",
        color: "var(--text-primary)",
        marginBottom: "4px",
    },
    cardDesc: {
        fontSize: "13px",
        color: "var(--text-secondary)",
        lineHeight: 1.4,
    },
    segmentedControl: {
        display: "flex",
        background: "var(--bg-input)",
        border: "1px solid var(--border-color)",
        padding: "4px",
        borderRadius: "6px",
        gap: "4px",
    },
    segmentActive: {
        flex: 1,
        padding: "12px",
        textAlign: "center",
        background: "var(--color-primary)",
        color: "#000",
        borderRadius: "6px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    segmentInactive: {
        flex: 1,
        padding: "12px",
        textAlign: "center",
        background: "transparent",
        color: "var(--text-primary)",
        borderRadius: "6px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    pillGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "8px",
    },
    durationActive: {
        padding: "12px",
        textAlign: "center",
        background: "var(--color-primary)",
        color: "#000",
        borderRadius: "6px",
        fontWeight: 600,
        cursor: "pointer",
        border: "1px solid var(--color-primary)",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "48px",
    },
    durationInactive: {
        padding: "12px",
        textAlign: "center",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        borderRadius: "6px",
        fontWeight: 500,
        cursor: "pointer",
        border: "1px solid var(--border-color)",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "48px",
    },
    btnSubmit: {
        padding: "12px 24px",
        background: "var(--color-primary)",
        color: "#000",
        border: "none",
        fontWeight: 600,
        cursor: "pointer",
        borderRadius: "0 !important",
    },
    btnCancel: {
        padding: "12px 24px",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        fontWeight: 600,
        cursor: "pointer",
        borderRadius: "0 !important",
    }
};