import { useState, useEffect } from "react";
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

export const CreateAuctionModal = ({
                                       item,
                                       isOpen,
                                       onClose,
                                       onSubmit,
                                       isLoading,
                                       error
                                   }: Props) => {
    const [visibleError, setVisibleError] = useState<string | null>(error);
    const [prevError, setPrevError] = useState<string | null>(error);
    if (error !== prevError) {
        setPrevError(error);       // Update the tracker
        setVisibleError(error);    // Sync the visible error
    }
    useEffect(() => {
        if (visibleError) {
            const timer = setTimeout(() => {
                setVisibleError(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [visibleError]);
    const [formData, setFormData] = useState({
        startingBid: 0,
        reservePrice: undefined as number | undefined,
        minBidIncrement: 50,
        durationDays: 7,
    });

    if (!isOpen || !item) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === "" ? undefined : Number(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Hide previous error immediately on new submit attempt
        setVisibleError(null);

        const start = new Date();
        start.setMinutes(start.getMinutes() + 2);

        const end = new Date(start);
        end.setDate(end.getDate() + formData.durationDays);

        const payload: CreateAuctionDto = {
            itemId: item.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            startingBid: formData.startingBid,
            reservePrice: formData.reservePrice,
            minBidIncrement: formData.minBidIncrement || 50
        };

        await onSubmit(payload);
    };

    const mainImage = item.images?.[0]?.thumbnailUrl;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="List Vehicle"
        >
            <form onSubmit={handleSubmit} style={{ padding: "8px 4px" }}>

                {visibleError && (
                    <div style={errorBannerStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>{visibleError}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setVisibleError(null)}
                            style={closeErrorBtnStyle}
                            title="Dismiss"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}

                {/* Header Preview */}
                <div style={headerStyle}>
                    <div style={imageWrapper}>
                        {mainImage ? (
                            <img src={mainImage} alt={item.model} style={imgStyle} />
                        ) : (
                            <div style={placeholderStyle}>No Photo</div>
                        )}
                    </div>
                    <div style={infoCol}>
                        <div style={yearBadge}>{item.year}</div>
                        <h3 style={titleStyle}>{item.make} {item.model}</h3>
                        <div style={metaStyle}>VIN: {item.vin}</div>
                    </div>
                </div>

                <div style={dividerStyle} />

                {/* Financials */}
                <div style={gridRow}>
                    <FormInput
                        label="Starting Bid"
                        name="startingBid"
                        type="number"
                        value={formData.startingBid}
                        onChange={handleChange}
                        placeholder="$0"
                        required
                    />
                    <FormInput
                        label="Reserve Price"
                        name="reservePrice"
                        type="number"
                        value={formData.reservePrice ?? ""}
                        onChange={handleChange}
                        placeholder="Optional"
                        hint="Minimum to sell"
                    />
                </div>

                {/* Settings */}
                <div style={gridRow}>
                    <FormInput
                        label="Min Increment"
                        name="minBidIncrement"
                        type="number"
                        value={formData.minBidIncrement}
                        onChange={handleChange}
                        placeholder="$50"
                        required
                    />
                    <FormInput
                        label="Duration (Days)"
                        name="durationDays"
                        type="number"
                        min={1}
                        max={30}
                        value={formData.durationDays}
                        onChange={handleChange}
                    />
                </div>

                {/* Actions */}
                <div style={footerStyle}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        style={cancelBtnStyle}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={submitBtnStyle}
                    >
                        {isLoading ? "Listing..." : "Start Auction"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Styles ---

const errorBannerStyle: React.CSSProperties = {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    marginBottom: "20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
    animation: "fadeIn 0.2s ease-in"
};

const closeErrorBtnStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
    opacity: 0.7,
    transition: "opacity 0.2s"
};

const headerStyle: React.CSSProperties = { display: "flex", gap: "20px", alignItems: "center", marginBottom: "24px" };
const imageWrapper: React.CSSProperties = { width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", background: "#f3f4f6", flexShrink: 0, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" };
const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const placeholderStyle: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa", textTransform: "uppercase", fontWeight: 600 };
const infoCol: React.CSSProperties = { display: "flex", flexDirection: "column", justifyContent: "center" };
const titleStyle: React.CSSProperties = { margin: "4px 0", fontSize: "20px", fontWeight: 700, color: "#111", lineHeight: 1.2 };
const yearBadge: React.CSSProperties = { display: "inline-block", background: "#f3f4f6", color: "#555", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", width: "fit-content" };
const metaStyle: React.CSSProperties = { fontSize: "13px", color: "#888", fontFamily: "monospace", letterSpacing: "0.5px" };
const dividerStyle: React.CSSProperties = { height: "1px", background: "#f0f0f0", marginBottom: "24px", width: "100%" };
const gridRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "16px" };
const footerStyle: React.CSSProperties = { marginTop: "32px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px" };
const submitBtnStyle: React.CSSProperties = { background: "#111", color: "#fff", border: "none", padding: "12px 32px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "background 0.2s" };
const cancelBtnStyle: React.CSSProperties = { background: "transparent", border: "none", color: "#666", fontSize: "14px", fontWeight: 500, cursor: "pointer" };