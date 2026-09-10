import { useState, useMemo, useEffect } from "react";
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
        setStartPrice("");
        setIsNoReserve(true);
        setReservePrice("");
        setDurationMinutes(10080);
        setStartMode("ASAP_AFTER_APPROVAL");
        const resetStart = new Date(Date.now() + 60 * 60 * 1000);
        resetStart.setSeconds(0, 0);
        setScheduledStartLocal(toLocalDateTimeInputValue(resetStart));
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
    const isStartPriceValid = Number.isFinite(startPriceNum) && startPriceNum > 0;
    const reservePriceNum = Number(reservePrice);
    const isReserveValid = isNoReserve || (!isNoReserve && Number.isFinite(reservePriceNum) && reservePriceNum > 0);

    const canProceed = isStartPriceValid && isReserveValid && isScheduledStartValid;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canProceed) return;

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
                {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

                <div className="form-group">
                    <label className="form-label">Starting Bid ($)</label>
                    <input
                        type="number"
                        className="form-input"
                        value={startPrice}
                        onChange={(e) => setStartPrice(e.target.value)}
                        placeholder="Enter minimum starting bid"
                        min={1}
                        required
                        autoFocus
                    />
                </div>

                <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Reserve Strategy</label>
                        <select 
                            className="form-select"
                            value={isNoReserve ? "NO_RESERVE" : "RESERVE"}
                            onChange={(e) => setIsNoReserve(e.target.value === "NO_RESERVE")}
                        >
                            <option value="NO_RESERVE">No Reserve (Sells to highest bidder)</option>
                            <option value="RESERVE">Set Reserve Price</option>
                        </select>
                    </div>

                    {!isNoReserve && (
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Reserve Price ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={reservePrice}
                                onChange={(e) => setReservePrice(e.target.value)}
                                placeholder="Min acceptable price"
                                min={1}
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Start Time</label>
                        <select 
                            className="form-select"
                            value={startMode}
                            onChange={(e) => setStartMode(e.target.value as StartMode)}
                        >
                            <option value="ASAP_AFTER_APPROVAL">ASAP (After Approval)</option>
                            <option value="SCHEDULED">Schedule for Later</option>
                        </select>
                    </div>

                    {startMode === "SCHEDULED" && (
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Scheduled Time</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={scheduledStartLocal}
                                onChange={(e) => setScheduledStartLocal(e.target.value)}
                                required
                            />
                            {scheduledStartError && <div className="form-error-text">{scheduledStartError}</div>}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Duration</label>
                    <select 
                        className="form-select"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    >
                        {DURATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-actions" style={{ marginTop: "32px", display: "flex", gap: "16px", justifyContent: "flex-end" }}>
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isLoading || !canProceed}>
                        {isLoading ? "Submitting..." : "Submit for Approval"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};