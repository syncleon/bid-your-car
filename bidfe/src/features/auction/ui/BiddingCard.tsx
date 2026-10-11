import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const [timeLeft, setTimeLeft] = useState("");
    const [isEndingSoon, setIsEndingSoon] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [localError, setLocalError] = useState<string | null>(null);

    const isEnded = new Date(auction.endTime).getTime() <= Date.now();
    const isActive = auction.status === "ACTIVE";
    const isOwner = authStore.user?.id === auction.item.seller.id;
    const isWinning = auction.winnerId === authStore.user?.id;
    const currentPrice = auction.currentPrice || auction.startPrice;
    const minBid = auction.bidCount === 0 ? auction.startPrice : currentPrice + auction.minBidIncrement;
    const displayError = localError || auctionStore.error;

    // Countdown timer
    useEffect(() => {
        const update = () => {
            const diff = new Date(auction.endTime).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft("Ended");
                setIsEndingSoon(false);
                return;
            }

            setIsEndingSoon(diff < 3600000);
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
    }, [auction.endTime]);

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

    const handlePlaceBid = async () => {
        setLocalError(null);
        auctionStore.clearError();

        if (cooldown > 0) return;
        if (!authStore.isAuthenticated) return setLocalError("Please log in to bid.");
        if (isOwner) return setLocalError("You cannot bid on your own item.");
        if (isWinning) return setLocalError("You are already the highest bidder.");

        const res = await auctionStore.submitQuickBid(auction.id);
        if (res?.success) setCooldown(2);
        else if (res?.error) setLocalError(res.error);
    };

    const getBtnText = () => {
        if (auctionStore.isBidding) return "Processing...";
        if (cooldown > 0) return `Wait ${cooldown}s`;
        if (isWinning) return "Winning";
        return "Place Bid";
    };

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
            {/* Meta Row: Time & Bids */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "14px"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={18} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 500 }}>Time Left</span>
                    <span
                        style={{
                            fontSize: "18px",
                            fontWeight: 800,
                            color: isEndingSoon && !isEnded ? "#ef4444" : "var(--text-primary)",
                            fontVariantNumeric: "tabular-nums",
                            marginLeft: "4px",
                        }}
                    >
                        {isEnded ? "Ended" : timeLeft}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 500 }}>Bids</span>
                    <span
                        style={{
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {auction.bidCount}
                    </span>
                </div>
            </div>

            {/* Price Info (Centered in available middle space) */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, gap: "6px" }}>
                <span
                    style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}
                >
                    {isEnded ? "Final Price" : "Current Bid"}
                </span>
                <span
                    style={{
                        fontSize: "52px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        lineHeight: 1.05,
                        letterSpacing: "-0.03em",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    ${currentPrice.toLocaleString()}
                </span>

                {isWinning && !isEnded && (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "8px",
                            padding: "6px 14px",
                            borderRadius: "100px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#4ade80",
                            backgroundColor: "rgba(74, 222, 128, 0.1)",
                            border: "1px solid rgba(74, 222, 128, 0.2)",
                            width: "fit-content",
                        }}
                    >
                        <CheckCircle size={16} /> You hold the highest bid
                    </div>
                )}
            </div>

            {/* Actions & Feedback (Pinned to bottom to match hero image height) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                {displayError && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            color: "#fca5a5",
                            backgroundColor: "rgba(153, 27, 27, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
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
                        <div style={{ fontSize: "15px", color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>
                            This is your listing.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button
                                className={`btn-place-bid ${isWinning ? "winning" : ""}`}
                                onClick={handlePlaceBid}
                                disabled={auctionStore.isBidding || cooldown > 0}
                            >
                                {getBtnText()}
                            </button>

                            {!isWinning && !auctionStore.isBidding && cooldown <= 0 && (
                                <span
                                    style={{
                                        fontSize: "15px",
                                        fontWeight: 500,
                                        color: "var(--text-muted)",
                                        textAlign: "center",
                                    }}
                                >
                                    Minimum next bid: ${minBid.toLocaleString()}
                                </span>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
});
