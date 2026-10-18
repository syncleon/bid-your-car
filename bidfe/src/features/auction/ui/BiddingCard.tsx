import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Clock, AlertCircle, CheckCircle, Trophy, Tag, Zap, ShieldCheck, Plus, Gavel, Loader2 } from "lucide-react";
import { useStore } from "../../../shared/hooks/useStore";
import { Modal } from "../../../shared/ui/Modal";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const [timeLeft, setTimeLeft] = useState("");
    const [isEndingSoon, setIsEndingSoon] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [localError, setLocalError] = useState<string | null>(null);

    const isEnded = (auction.status && auction.status !== "ACTIVE") || new Date(auction.endTime).getTime() <= Date.now();
    const isActive = auction.status === "ACTIVE" && !isEnded;
    const isOwner = authStore.user?.id === auction.item.seller.id;
    const isWinning = auction.winnerId === authStore.user?.id;
    const currentPrice = auction.currentPrice || auction.startPrice;
    const minBid = auction.bidCount === 0 ? auction.startPrice : currentPrice + auction.minBidIncrement;
    const displayError = localError || auctionStore.error;

    const [customBid, setCustomBid] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingBid, setPendingBid] = useState<{ amount: number; isQuick: boolean } | null>(null);

    // Countdown timer
    useEffect(() => {
        const update = () => {
            if (auction.status && auction.status !== "ACTIVE") {
                setTimeLeft(auction.status === "SOLD" ? "Sold" : "Ended");
                setIsEndingSoon(false);
                return;
            }
            const diff = new Date(auction.endTime).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft("Ended");
                setIsEndingSoon(false);
                return;
            }

            setIsEndingSoon(diff < 60000); // Highlight in red when under 1 minute (Cars & Bids rule)
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            if (d > 0) setTimeLeft(`${d}d ${h}h`);
            else if (h > 0) setTimeLeft(`${h}h ${m}m`);
            else setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        };

        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [auction.endTime, auction.status]);

    // Cooldown ticker
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Auto-dismiss error & parse cooldown
    useEffect(() => {
        if (!displayError) return;
        const match = displayError.match(/Wait (\d+) seconds/i);
        if (match) setCooldown(parseInt(match[1], 10));

        const timer = setTimeout(() => {
            setLocalError(null);
            auctionStore.clearError();
        }, 4000);
        return () => clearTimeout(timer);
    }, [displayError, auctionStore]);

    const handleInitiateQuickBid = () => {
        setLocalError(null);
        auctionStore.clearError();

        if (cooldown > 0) return;
        if (!authStore.isAuthenticated) return setLocalError("Please log in to bid.");
        if (isOwner) return setLocalError("You cannot bid on your own item.");
        if (isWinning) return setLocalError("You are already the highest bidder.");

        setPendingBid({ amount: minBid, isQuick: true });
        setIsConfirmOpen(true);
    };

    const handleInitiateCustomBid = () => {
        setLocalError(null);
        auctionStore.clearError();

        if (cooldown > 0) return;
        if (!authStore.isAuthenticated) return setLocalError("Please log in to bid.");
        if (isOwner) return setLocalError("You cannot bid on your own item.");
        if (isWinning) return setLocalError("You are already the highest bidder.");

        const bidAmountNum = Number(customBid);
        if (!bidAmountNum || Number.isNaN(bidAmountNum)) {
            return setLocalError("Please enter a valid bid amount.");
        }
        if (bidAmountNum < minBid) {
            return setLocalError(`Minimum required bid is $${minBid.toLocaleString()}.`);
        }

        setPendingBid({ amount: bidAmountNum, isQuick: false });
        setIsConfirmOpen(true);
    };

    const handleConfirmBid = async () => {
        if (!pendingBid) return;
        const { amount, isQuick } = pendingBid;
        const res = isQuick
            ? await auctionStore.submitQuickBid(auction.id)
            : await auctionStore.submitBid(auction.id, amount);

        if (res?.success) {
            setCooldown(2);
            setIsConfirmOpen(false);
            setPendingBid(null);
            setCustomBid("");
        } else if (res?.error) {
            setLocalError(res.error);
            setIsConfirmOpen(false);
        }
    };

    const parsedCustom = customBid ? Number(customBid) : 0;
    const isCustomValid = !customBid || parsedCustom >= minBid;
    const canSubmitCustom = Boolean(customBid) && parsedCustom >= minBid;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                flexGrow: 1,
                justifyContent: "space-between",
                gap: "16px",
            }}
        >
            {/* Meta Row: Time, Bids & Reserve Status */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "14px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    gap: "8px",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={18} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 500 }}>Time Left</span>
                    <span
                        style={{
                            fontSize: "17px",
                            fontWeight: 800,
                            color: isEndingSoon && !isEnded ? "#ef4444" : "var(--text-primary)",
                            fontVariantNumeric: "tabular-nums",
                            marginLeft: "4px",
                        }}
                    >
                        {isEnded ? (auction.status === "SOLD" ? "Sold" : "Ended") : timeLeft}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Reserve / No Reserve Badge */}
                    {auction.isNoReserve ? (
                        <span
                            style={{
                                padding: "3px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                backgroundColor: "rgba(34, 197, 94, 0.15)",
                                color: "#4ade80",
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                            }}
                        >
                            No Reserve
                        </span>
                    ) : (
                        <span
                            style={{
                                padding: "3px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                backgroundColor: auction.isReserveMet
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "rgba(245, 158, 11, 0.15)",
                                color: auction.isReserveMet ? "#4ade80" : "#f59e0b",
                                border: auction.isReserveMet
                                    ? "1px solid rgba(34, 197, 94, 0.3)"
                                    : "1px solid rgba(245, 158, 11, 0.3)",
                            }}
                        >
                            {auction.isReserveMet ? "Reserve Met" : "Reserve Not Met"}
                        </span>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 500 }}>Bids</span>
                        <span
                            style={{
                                fontSize: "17px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {auction.bidCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Price Info */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, gap: "4px" }}>
                <span
                    style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                    }}
                >
                    {isEnded
                        ? (auction.isReserveMet || auction.isNoReserve ? "Sold Price" : "Final Bid (Reserve Not Met)")
                        : "Current Bid"}
                </span>
                <span
                    style={{
                        fontSize: "48px",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        lineHeight: 1.05,
                        letterSpacing: "-0.03em",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    ${currentPrice.toLocaleString()}
                </span>

                {/* Reserve Explanation Line */}
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginTop: "2px" }}>
                    {isEnded
                        ? (auction.isReserveMet || auction.isNoReserve
                            ? "Auction completed • Sold to the highest bidder."
                            : "Auction completed • Reserve was not met.")
                        : (auction.isNoReserve
                            ? "No reserve price. This vehicle will sell to the highest bidder."
                            : auction.isReserveMet
                            ? "Reserve met! This vehicle will sell to the highest bidder."
                            : "Reserve price not yet met. (Seller reserve is hidden).")}
                </span>



                {isEnded && (
                    <div style={{ marginTop: "10px", fontSize: "14px", lineHeight: 1.4 }}>
                        {auction.isReserveMet || auction.isNoReserve ? (
                            isWinning ? (
                                <div style={{ color: "#4ade80", fontWeight: 600, padding: "8px 12px", borderRadius: "8px", backgroundColor: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)" }}>
                                    🎉 Congratulations! You won this auction at ${currentPrice.toLocaleString()}.
                                </div>
                            ) : (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "8px", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)", color: "#4ade80", fontWeight: 600 }}>
                                    <Trophy size={16} /> Auction ended and vehicle successfully sold.
                                </div>
                            )
                        ) : (
                            isWinning ? (
                                <div style={{ color: "#f59e0b", fontWeight: 600, padding: "8px 12px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                                    Reserve not met. As the highest bidder (${currentPrice.toLocaleString()}), you have exclusive rights to negotiate a post-auction deal with the seller.
                                </div>
                            ) : (
                                <span style={{ color: "var(--text-muted)" }}>
                                    Reserve price was not met. The vehicle was not sold automatically.
                                </span>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Actions & Feedback */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                {displayError && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "13px",
                            color: "#fca5a5",
                            backgroundColor: "rgba(153, 27, 27, 0.25)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "8px",
                            padding: "10px 14px",
                        }}
                    >
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{displayError}</span>
                    </div>
                )}

                {!isEnded && isActive && (
                    isOwner ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                fontSize: "13px",
                                color: "var(--text-secondary)",
                                padding: "14px 16px",
                                borderRadius: "10px",
                                backgroundColor: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                lineHeight: 1.4,
                                textAlign: "left",
                            }}
                        >
                            <div style={{ width: 34, height: 34, borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Tag size={17} style={{ color: "#f59e0b" }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px", marginBottom: "2px" }}>Seller Account</div>
                                <div>This is your listing. Sellers cannot place bids on their own items.</div>
                            </div>
                        </div>
                    ) : isWinning ? (
                        <div
                            style={{
                                padding: "18px 20px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(74, 222, 128, 0.08)",
                                border: "1px solid rgba(74, 222, 128, 0.25)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                textAlign: "left",
                                boxShadow: "0 4px 16px rgba(74, 222, 128, 0.08)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(74, 222, 128, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Trophy size={18} style={{ color: "#4ade80" }} />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#4ade80", display: "block" }}>Highest Bidder</span>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#4ade80", opacity: 0.9 }}>You currently hold the highest bid</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5, borderTop: "1px solid rgba(74, 222, 128, 0.15)", paddingTop: "8px" }}>
                                You are the leading bidder at <strong style={{ color: "#4ade80" }}>${currentPrice.toLocaleString()}</strong>. If someone outbids you, you can place a new bid.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {/* Custom Bid Row: input & place bid button */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                                <div style={{ position: "relative", flex: 1 }}>
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: "14px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "var(--text-muted)",
                                            fontSize: "17px",
                                            fontWeight: 700,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step={auction.minBidIncrement}
                                        min={minBid}
                                        value={customBid}
                                        onChange={(e) => setCustomBid(e.target.value)}
                                        placeholder={`Min. $${minBid.toLocaleString()}`}
                                        disabled={auctionStore.isBidding || cooldown > 0}
                                        style={{
                                            width: "100%",
                                            height: "52px",
                                            paddingLeft: "30px",
                                            paddingRight: "12px",
                                            background: "rgba(255, 255, 255, 0.05)",
                                            border: isCustomValid ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(239, 68, 68, 0.6)",
                                            borderRadius: "10px",
                                            color: "var(--text-primary)",
                                            fontSize: "17px",
                                            fontWeight: 700,
                                            fontVariantNumeric: "tabular-nums",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <button
                                    className="btn-place-bid"
                                    onClick={handleInitiateCustomBid}
                                    disabled={auctionStore.isBidding || cooldown > 0 || !canSubmitCustom}
                                    style={{
                                        flex: "1.2",
                                        height: "52px",
                                        fontSize: "16px",
                                        padding: "0 16px",
                                        margin: 0,
                                    }}
                                >
                                    {auctionStore.isBidding
                                        ? "Placing Bid..."
                                        : cooldown > 0
                                        ? `Wait ${cooldown}s`
                                        : canSubmitCustom
                                        ? `Bid $${parsedCustom.toLocaleString()}`
                                        : "Place Bid"}
                                </button>
                            </div>

                            {/* Inline Helper / Validation Feedback */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "18px", padding: "0 2px" }}>
                                {!isCustomValid ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#f87171", fontWeight: 500 }}>
                                        <AlertCircle size={13} /> Minimum required bid is ${minBid.toLocaleString()}
                                    </span>
                                ) : (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                                        Min increment: ${auction.minBidIncrement.toLocaleString()}
                                    </span>
                                )}

                                {/* Quick increment chips */}
                                <div style={{ display: "flex", gap: "4px" }}>
                                    {[auction.minBidIncrement, 500, 1000].filter((inc, idx, self) => inc > 0 && self.indexOf(inc) === idx).map((inc) => (
                                        <button
                                            key={inc}
                                            type="button"
                                            onClick={() => {
                                                const base = Math.max(Number(customBid) || minBid, minBid);
                                                setCustomBid(String(base + inc));
                                            }}
                                            style={{
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                                color: "var(--text-secondary)",
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                            }}
                                        >
                                            +${inc.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Bid Button */}
                            <button
                                type="button"
                                onClick={handleInitiateQuickBid}
                                disabled={auctionStore.isBidding || cooldown > 0}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    background: "rgba(255, 255, 255, 0.06)",
                                    border: "1px solid rgba(255, 255, 255, 0.14)",
                                    borderRadius: "10px",
                                    color: "var(--text-primary)",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <Zap size={15} style={{ color: "#f97316" }} />
                                Quick Bid: ${minBid.toLocaleString()} (+${auction.minBidIncrement.toLocaleString()} step)
                            </button>

                            {/* Transparent Cars & Bids Terms Box */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                    fontSize: "12px",
                                    color: "var(--text-muted)",
                                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                    borderRadius: "10px",
                                    padding: "10px 12px",
                                    lineHeight: 1.4,
                                    marginTop: "2px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Zap size={13} style={{ color: "#f97316", flexShrink: 0 }} />
                                    <span><strong>Direct Bidding:</strong> All bids are placed immediately (no automated proxy bids).</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Clock size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                    <span><strong>Sniping Protection:</strong> Bids in the final 60 seconds reset clock to 1:00.</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <ShieldCheck size={13} style={{ color: "#4ade80", flexShrink: 0 }} />
                                    <span><strong>Buyer's Fee:</strong> 4.5% (min $225, max $4,500) held only on winning bid.</span>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* Bid Confirmation Dialog */}
            <Modal
                isOpen={isConfirmOpen}
                onClose={() => {
                    if (!auctionStore.isBidding) {
                        setIsConfirmOpen(false);
                        setPendingBid(null);
                    }
                }}
                title="Confirm Your Bid"
                maxWidth="480px"
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "18px",
                        width: "100%",
                        textAlign: "center",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: "50%",
                                backgroundColor: "rgba(249, 115, 22, 0.15)",
                                border: "1px solid rgba(249, 115, 22, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "4px",
                            }}
                        >
                            <Gavel size={26} style={{ color: "#f97316" }} />
                        </div>
                        <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 600 }}>
                            {auction.item.year} {auction.item.make} {auction.item.model}
                        </span>
                        <div
                            style={{
                                fontSize: "38px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                letterSpacing: "-0.02em",
                                fontVariantNumeric: "tabular-nums",
                                lineHeight: 1.1,
                            }}
                        >
                            ${(pendingBid?.amount || 0).toLocaleString()}
                        </div>
                        <span style={{ fontSize: "13px", color: "#4ade80", fontWeight: 600 }}>
                            {pendingBid && pendingBid.amount > currentPrice
                                ? `+$${(pendingBid.amount - currentPrice).toLocaleString()} above current bid`
                                : "Next minimum bid"}
                        </span>
                    </div>

                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "10px",
                            padding: "14px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            textAlign: "left",
                            lineHeight: 1.45,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px" }}>
                            <span style={{ color: "var(--text-muted)" }}>Current Bid:</span>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>${currentPrice.toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px" }}>
                            <span style={{ color: "var(--text-muted)" }}>Your New Bid:</span>
                            <span style={{ fontWeight: 700, color: "#f97316" }}>${(pendingBid?.amount || 0).toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "6px" }}>
                            <span style={{ color: "var(--text-muted)" }}>Buyer's Fee (4.5% if won):</span>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                ${Math.max(225, Math.min(4500, Math.round((pendingBid?.amount || 0) * 0.045))).toLocaleString()}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2px" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Total Commitment:</span>
                            <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "14px" }}>
                                ${(
                                    (pendingBid?.amount || 0) +
                                    Math.max(225, Math.min(4500, Math.round((pendingBid?.amount || 0) * 0.045)))
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
                        By placing this bid, you agree to purchase this vehicle for ${(pendingBid?.amount || 0).toLocaleString()} if you are the winning bidder.
                    </p>

                    {localError && (
                        <div style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600 }}>
                            {localError}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "4px" }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsConfirmOpen(false);
                                setPendingBid(null);
                            }}
                            disabled={auctionStore.isBidding}
                            style={{
                                flex: 1,
                                height: "46px",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                borderRadius: "8px",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "background 0.2s ease",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn-confirm-bid"
                            onClick={handleConfirmBid}
                            disabled={auctionStore.isBidding}
                            style={{
                                flex: 1.4,
                                height: "46px",
                                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                border: "none",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "15px",
                                fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                            }}
                        >
                            {auctionStore.isBidding ? (
                                <>
                                    <Loader2 size={18} className="spinner" />
                                    Placing Bid...
                                </>
                            ) : (
                                "Confirm & Place Bid"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
});
