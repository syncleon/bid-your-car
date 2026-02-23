import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { Modal } from "../../../shared/ui/Modal";
import type { CreateAuctionDto } from "../types";
import type { ItemDto } from "../../item/types";

const DURATION_OPTIONS = [
    { label: "1 Hour", value: 60, desc: "Flash sale" },
    { label: "1 Day", value: 1440, desc: "Urgent" },
    { label: "3 Days", value: 4320, desc: "Quick" },
    { label: "5 Days", value: 7200, desc: "Work week" },
    { label: "1 Week", value: 10080, desc: "Standard" },
    { label: "2 Weeks", value: 20160, desc: "Max reach" },
    { label: "1 Month", value: 43200, desc: "Long term" },
] as const;

const STEPS = [
    { id: 1, title: "Vehicle Review" },
    { id: 2, title: "Bidding Rules" },
    { id: 3, title: "Final Review" },
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

const MIN_SCHEDULE_OFFSET_MS = 30_000; // 30 seconds
const ASAP_PREVIEW_OFFSET_MS = 60_000; // 1 minute

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
    const [bidIncrement, setBidIncrement] = useState<number>(50);
    const [durationMinutes, setDurationMinutes] = useState<number>(10080);
    const [selectedImgIdx, setSelectedImgIdx] = useState(0);

    const [startMode, setStartMode] = useState<StartMode>("ASAP_AFTER_APPROVAL");
    const [scheduledStartLocal, setScheduledStartLocal] = useState<string>(() => {
        const defaultStart = new Date(Date.now() + 60 * 60 * 1000);
        defaultStart.setSeconds(0, 0);
        return toLocalDateTimeInputValue(defaultStart);
    });

    useEffect(() => {
        if (!isOpen) return;

        setCurrentStep(1);
        setSelectedImgIdx(0);

        setStartPrice("");
        setBidIncrement(50);
        setDurationMinutes(10080);
        setStartMode("ASAP_AFTER_APPROVAL");
        const resetStart = new Date(Date.now() + 60 * 60 * 1000);
        resetStart.setSeconds(0, 0);
        setScheduledStartLocal(toLocalDateTimeInputValue(resetStart));
    }, [isOpen, item?.id]);

    const durationLabel =
        DURATION_OPTIONS.find((o) => o.value === durationMinutes)?.label ?? "Custom";

    const scheduledStartDate = useMemo(
        () => parseLocalDateTime(scheduledStartLocal),
        [scheduledStartLocal]
    );

    const nowMs = Date.now();
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

    const startDateForPreview = useMemo(() => {
        if (startMode === "SCHEDULED" && scheduledStartDate) return scheduledStartDate;
        return new Date(Date.now() + ASAP_PREVIEW_OFFSET_MS);
    }, [startMode, scheduledStartDate]);

    const projectedEndDate = useMemo(() => {
        const d = new Date(startDateForPreview);
        d.setMinutes(d.getMinutes() + durationMinutes);

        if (durationMinutes < 1440) {
            return d.toLocaleString("en-US", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit"
            });
        }

        return d.toLocaleString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }, [startDateForPreview, durationMinutes]);

    const images = item?.images ?? [];
    const mainImage = images[selectedImgIdx]?.url ?? null;

    if (!isOpen || !item) return null;

    const startPriceNum = Number(startPrice);
    const isStartPriceValid = Number.isFinite(startPriceNum) && startPriceNum > 0;
    const isBidIncrementValid = Number.isFinite(bidIncrement) && bidIncrement > 0;

    const isStep1Valid = true;
    const isStep2Valid =
        isStartPriceValid &&
        isBidIncrementValid &&
        durationMinutes > 0 &&
        isScheduledStartValid;

    const canProceed =
        currentStep === 1 ? isStep1Valid :
            currentStep === 2 ? isStep2Valid :
                true;

    const handleNext = () => {
        if (!canProceed) return;
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!isStep2Valid || !isStartPriceValid) return;

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
            minBidIncrement: bidIncrement,
        };

        await onSubmit(payload);
    };

    const startTimeSummary =
        startMode === "ASAP_AFTER_APPROVAL"
            ? "ASAP after admin approval"
            : scheduledStartDate
                ? scheduledStartDate.toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                })
                : "Invalid date/time";

    const handleBidIncrementChange = (raw: string) => {
        const parsed = Number(raw);
        setBidIncrement(Number.isFinite(parsed) ? parsed : 0);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="List Vehicle for Auction">
            <div style={styles.container}>
                <div style={styles.progressContainer}>
                    <div
                        style={{
                            ...styles.progressBar,
                            width: `${(currentStep / STEPS.length) * 100}%`
                        }}
                    />
                </div>

                <div style={styles.stepTitleContainer}>
                    <span style={styles.stepCount}>
                        Step {currentStep} of {STEPS.length}
                    </span>
                    <h2 style={styles.stepHeading}>{STEPS[currentStep - 1].title}</h2>
                </div>

                {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

                <div style={styles.sliderWindow}>
                    <div
                        style={{
                            ...styles.sliderTrack,
                            width: `${STEPS.length * 100}%`,
                            transform: `translateX(-${(currentStep - 1) * (100 / STEPS.length)}%)`
                        }}
                    >
                        {/* Step 1 */}
                        <div style={{ ...styles.slide, width: `${100 / STEPS.length}%` }}>
                            <div style={styles.heroImageContainer}>
                                {mainImage ? (
                                    <img src={mainImage} alt="Vehicle" style={styles.heroImg} />
                                ) : (
                                    <div style={styles.placeholderHero}>No Images Available</div>
                                )}
                                <div style={styles.heroOverlay}>
                                    <h3 style={styles.heroTitle}>
                                        {item.year} {item.make} {item.model}
                                    </h3>
                                    <div style={styles.heroSubtitle}>
                                        {item.vin} • {item.mileage.toLocaleString()} mi
                                    </div>
                                </div>
                            </div>

                            {images.length > 1 && (
                                <div style={styles.thumbStrip}>
                                    {images.slice(0, 5).map((img, i) => (
                                        <button
                                            key={img.id}
                                            type="button"
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

                        {/* Step 2 */}
                        <div style={{ ...styles.slide, width: `${100 / STEPS.length}%` }}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Starting Bid</label>
                                <div style={styles.moneyInputWrapper}>
                                    <span style={styles.currency}>$</span>
                                    <input
                                        type="number"
                                        style={styles.moneyInput}
                                        value={startPrice}
                                        onChange={(e) => setStartPrice(e.target.value)}
                                        placeholder="0"
                                        autoFocus={currentStep === 2}
                                        min={1}
                                    />
                                </div>
                                <p style={styles.subtext}>
                                    The minimum amount required to open the bidding.
                                </p>
                            </div>

                            <div style={{ ...styles.inputGroup, marginTop: 20 }}>
                                <label style={styles.label}>Minimum Bid Increment</label>
                                <div style={styles.moneyInputWrapper}>
                                    <span style={styles.currency}>$</span>
                                    <input
                                        type="number"
                                        value={Number.isFinite(bidIncrement) ? bidIncrement : ""}
                                        onChange={(e) => handleBidIncrementChange(e.target.value)}
                                        style={styles.moneyInput}
                                        min={1}
                                    />
                                </div>
                                <p style={styles.subtext}>
                                    How much each subsequent bid must increase by.
                                </p>
                            </div>

                            <div style={{ ...styles.inputGroup, marginTop: 20 }}>
                                <label style={styles.label}>Auction Start Time</label>

                                <div style={styles.segmentedControl}>
                                    <button
                                        type="button"
                                        onClick={() => setStartMode("ASAP_AFTER_APPROVAL")}
                                        style={
                                            startMode === "ASAP_AFTER_APPROVAL"
                                                ? styles.segmentBtnActive
                                                : styles.segmentBtn
                                        }
                                    >
                                        After Approval (ASAP)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStartMode("SCHEDULED")}
                                        style={
                                            startMode === "SCHEDULED"
                                                ? styles.segmentBtnActive
                                                : styles.segmentBtn
                                        }
                                    >
                                        Schedule
                                    </button>
                                </div>

                                {startMode === "SCHEDULED" ? (
                                    <div style={{ marginTop: 10 }}>
                                        <input
                                            type="datetime-local"
                                            value={scheduledStartLocal}
                                            onChange={(e) => setScheduledStartLocal(e.target.value)}
                                            style={styles.datetimeInput}
                                        />
                                        {scheduledStartError && (
                                            <div style={styles.inlineError}>{scheduledStartError}</div>
                                        )}
                                        <p style={styles.subtext}>
                                            Select the exact time when the auction should go live.
                                        </p>
                                    </div>
                                ) : (
                                    <p style={styles.subtext}>
                                        Auction starts automatically as soon as admin approves it.
                                    </p>
                                )}
                            </div>

                            <div style={{ marginTop: 24 }}>
                                <label style={styles.label}>Auction Duration</label>
                                <div style={styles.pillContainer}>
                                    {DURATION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
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
                                📅 <strong>Starts:</strong> {startTimeSummary}
                                <br />
                                📍 <strong>Ends approximately:</strong> {projectedEndDate}
                                <br />
                                <span style={styles.infoHint}>
                                    {startMode === "ASAP_AFTER_APPROVAL"
                                        ? "Exact start depends on admin approval time."
                                        : "End time is calculated from the scheduled start time."}
                                </span>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div style={{ ...styles.slide, width: `${100 / STEPS.length}%` }}>
                            <div style={styles.summaryCard}>
                                <SummaryRow label="Vehicle" value={`${item.year} ${item.make} ${item.model}`} />
                                <SummaryRow label="VIN" value={item.vin} />
                                <div style={styles.divider} />

                                <SummaryRow
                                    label="Pricing Strategy"
                                    value={item.isNoReserve ? "No Reserve" : "Reserve Set"}
                                    highlight={item.isNoReserve}
                                />

                                {!item.isNoReserve && (
                                    <SummaryRow
                                        label="Reserve Target"
                                        value={`$${item.reservePrice?.toLocaleString() || "Not Set"}`}
                                    />
                                )}

                                <div style={styles.divider} />
                                <SummaryRow label="Starting Bid" value={`$${startPriceNum.toLocaleString()}`} />
                                <SummaryRow label="Bid Increment" value={`$${bidIncrement.toLocaleString()}`} />
                                <SummaryRow label="Start Time" value={startTimeSummary} />
                                <SummaryRow label="Duration" value={durationLabel} />
                            </div>

                            <p style={styles.disclaimer}>
                                By clicking "Submit", your listing will be queued for admin review.
                                {startMode === "SCHEDULED"
                                    ? " It will go live at the scheduled time after approval."
                                    : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    {currentStep > 1 ? (
                        <button type="button" onClick={handleBack} style={styles.backBtn}>
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {currentStep < STEPS.length ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!canProceed}
                            style={canProceed ? styles.nextBtn : styles.disabledBtn}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading || !canProceed}
                            style={styles.submitBtn}
                        >
                            {isLoading ? "Submitting..." : "Submit for Approval"}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
        </Modal>
    );
};

const SummaryRow = ({
                        label,
                        value,
                        highlight
                    }: {
    label: string;
    value: string;
    highlight?: boolean;
}) => (
    <div style={styles.summaryRow}>
        <span style={styles.summaryRowLabel}>{label}</span>
        <span
            style={{
                ...styles.summaryRowValue,
                ...(highlight ? styles.summaryRowValueHighlight : null)
            }}
        >
            {value}
        </span>
    </div>
);

type StyleMap = Record<string, CSSProperties>;

const styles: StyleMap = {
    container: {
        fontFamily: "'Inter', sans-serif",
        color: "var(--text-primary)",
        padding: "0 4px"
    },

    progressContainer: {
        height: "4px",
        background: "var(--bg-input)",
        borderRadius: "2px",
        overflow: "hidden",
        marginBottom: "16px"
    },
    progressBar: {
        height: "100%",
        background: "var(--accent-color)",
        transition: "width 0.3s ease"
    },

    stepTitleContainer: { marginBottom: "24px" },
    stepCount: {
        fontSize: "12px",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        fontWeight: 600,
        letterSpacing: "0.5px"
    },
    stepHeading: {
        fontSize: "24px",
        fontWeight: 700,
        margin: "4px 0 0 0",
        color: "var(--text-primary)"
    },

    sliderWindow: { overflow: "hidden", width: "100%" },
    sliderTrack: {
        display: "flex",
        transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
    },
    slide: {
        boxSizing: "border-box",
        padding: "2px"
    },

    heroImageContainer: {
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        aspectRatio: "16/9",
        background: "var(--bg-input)"
    },
    heroImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: 0.9
    },
    heroOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
        padding: "20px",
        color: "#fff"
    },
    heroTitle: {
        margin: 0,
        fontSize: "20px",
        fontWeight: 700
    },
    heroSubtitle: {
        fontSize: "13px",
        opacity: 0.9,
        marginTop: "4px"
    },
    placeholderHero: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)"
    },

    thumbStrip: {
        display: "flex",
        gap: "8px",
        marginTop: "12px",
        alignItems: "center"
    },
    thumbBtn: {
        border: "2px solid transparent",
        padding: 0,
        borderRadius: "6px",
        cursor: "pointer",
        background: "none",
        transition: "all 0.2s"
    },
    thumbImg: {
        width: "48px",
        height: "36px",
        objectFit: "cover",
        borderRadius: "4px"
    },

    helperText: {
        fontSize: "13px",
        color: "var(--text-secondary)",
        marginTop: "20px",
        lineHeight: 1.5
    },

    inputGroup: { marginBottom: "16px" },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: "8px"
    },
    subtext: {
        fontSize: "12px",
        color: "var(--text-secondary)",
        marginTop: "6px",
        fontStyle: "italic"
    },
    moneyInputWrapper: {
        display: "flex",
        alignItems: "center",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "0 12px",
        height: "48px",
        background: "var(--bg-input)"
    },
    currency: {
        fontSize: "18px",
        color: "var(--text-muted)",
        fontWeight: 500
    },
    moneyInput: {
        border: "none",
        fontSize: "18px",
        fontWeight: 600,
        width: "100%",
        outline: "none",
        marginLeft: "8px",
        color: "var(--text-primary)",
        background: "transparent"
    },

    segmentedControl: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px"
    },
    segmentBtn: {
        border: "1px solid var(--border-color)",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        borderRadius: "8px",
        padding: "10px 12px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer"
    },
    segmentBtnActive: {
        border: "2px solid var(--accent-color)",
        background: "var(--bg-hover)",
        color: "var(--text-primary)",
        borderRadius: "8px",
        padding: "9px 11px",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer"
    },
    datetimeInput: {
        width: "100%",
        height: "44px",
        borderRadius: "8px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-input)",
        color: "var(--text-primary)",
        padding: "0 12px",
        fontSize: "14px",
        boxSizing: "border-box"
    },
    inlineError: {
        marginTop: "6px",
        color: "var(--color-danger-text)",
        fontSize: "12px"
    },

    pillContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
        gap: "10px"
    },
    pill: {
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "12px 4px",
        cursor: "pointer",
        textAlign: "center",
        minHeight: "60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.2s ease"
    },
    pillActive: {
        background: "var(--bg-hover)",
        border: "2px solid var(--accent-color)",
        borderRadius: "8px",
        padding: "11px 3px",
        cursor: "pointer",
        textAlign: "center",
        minHeight: "60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    },
    pillTitle: {
        display: "block",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--text-primary)"
    },
    pillDesc: {
        display: "block",
        fontSize: "10px",
        opacity: 0.8,
        marginTop: "2px",
        color: "var(--text-secondary)"
    },

    infoBox: {
        marginTop: "24px",
        background: "var(--bg-input)",
        border: "1px solid var(--border-color)",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        color: "var(--text-primary)",
        lineHeight: 1.5
    },
    infoHint: {
        fontSize: "12px",
        opacity: 0.8
    },

    summaryCard: {
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "20px"
    },
    divider: {
        height: "1px",
        background: "var(--border-color)",
        margin: "12px 0"
    },

    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "8px"
    },
    summaryRowLabel: {
        color: "var(--text-secondary)",
        fontSize: "14px"
    },
    summaryRowValue: {
        color: "var(--text-primary)",
        fontWeight: 600,
        fontSize: "14px",
        textAlign: "right"
    },
    summaryRowValueHighlight: {
        color: "var(--color-success-text)",
        fontWeight: 700
    },

    disclaimer: {
        fontSize: "12px",
        color: "var(--text-muted)",
        textAlign: "center",
        marginTop: "20px",
        lineHeight: 1.4
    },

    footer: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "32px",
        paddingTop: "20px",
        borderTop: "1px solid var(--border-color)"
    },
    backBtn: {
        background: "none",
        border: "none",
        color: "var(--text-secondary)",
        fontWeight: 600,
        fontSize: "14px",
        cursor: "pointer"
    },
    nextBtn: {
        background: "var(--btn-primary-bg)",
        color: "var(--btn-primary-text)",
        border: "none",
        padding: "12px 24px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "14px",
        cursor: "pointer"
    },
    disabledBtn: {
        background: "var(--bg-input)",
        color: "var(--text-muted)",
        border: "none",
        padding: "12px 24px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "14px",
        cursor: "not-allowed"
    },
    submitBtn: {
        background: "var(--color-success-bg)",
        color: "var(--color-success-text)",
        border: "1px solid var(--color-success-border)",
        padding: "12px 24px",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "14px",
        cursor: "pointer"
    },
    errorBanner: {
        background: "var(--color-danger-bg)",
        color: "var(--color-danger-text)",
        border: "1px solid var(--color-danger-border)",
        padding: "10px",
        borderRadius: "6px",
        marginBottom: "16px",
        fontSize: "13px"
    }
};