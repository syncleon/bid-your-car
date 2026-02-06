import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const [bidAmount, setBidAmount] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState("");

    // ✅ CHANGED: Track seconds instead of just boolean
    const [cooldown, setCooldown] = useState(0);
    const isCoolingDown = cooldown > 0;

    // Derived State
    const isActive = auction.status === 'ACTIVE';
    const isEnded = new Date(auction.endTime).getTime() < Date.now();
    const isOwner = authStore.user?.id === auction.item.seller.id;
    const currentPrice = auction.currentHighestBid || auction.startPrice;
    const minBid = auction.bidCount === 0 ? auction.startPrice : currentPrice + auction.minBidIncrement;

    // Timer: Auction Countdown
    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const end = new Date(auction.endTime).getTime();
            const diff = end - now;
            if (diff <= 0) return setTimeLeft("Ended");

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [auction.endTime]);

    // ✅ NEW: Timer: Cooldown Countdown
    useEffect(() => {
        if (!isCoolingDown) return;

        const interval = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isCoolingDown]);

    // Handlers
    const submitBid = async (amount: number) => {
        if (isCoolingDown) return;
        if (!authStore.isAuthenticated) return alert("Please log in to bid.");
        if (isOwner) return;
        if (amount < minBid) return alert(`Bid must be at least $${minBid.toLocaleString()}`);

        const success = await auctionStore.submitBid({ auctionId: auction.id, amount });
        if (success) {
            setBidAmount("");
            // ✅ Start 5 second cooldown
            setCooldown(5);
        }
    };

    const handleManualBid = (e: React.FormEvent) => {
        e.preventDefault();
        submitBid(Number(bidAmount));
    };

    const handleQuickBid = () => {
        setBidAmount(minBid.toString());
    };

    // UI State
    const isValidBid = bidAmount !== "" && Number(bidAmount) >= minBid;
    const isDisabled = auctionStore.isBidding || isCoolingDown || !isValidBid;
    const isUrgent = isActive && !isEnded && (new Date(auction.endTime).getTime() - Date.now() < 3600000);

    return (
        <div style={styles.card}>
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .bid-focus:focus-within { border-color: #000; box-shadow: 0 0 0 1px #000; }
            `}</style>

            {/* Header / Timer Bar */}
            <div style={styles.header}>
                <div style={styles.headerItem}>
                    <span style={styles.label}>Time Left</span>
                    <span style={{
                        ...styles.value,
                        color: isUrgent ? "#dc2626" : "#111",
                        fontWeight: isUrgent ? 800 : 700
                    }}>
                        {timeLeft}
                    </span>
                </div>
                <div style={styles.headerDivider} />
                <div style={styles.headerItem}>
                    <span style={styles.label}>Bids</span>
                    <span style={styles.value}>{auction.bidCount}</span>
                </div>
            </div>

            <div style={styles.divider} />

            {/* Main Price Area */}
            <div style={styles.heroSection}>
                <div style={styles.currentBidLabel}>
                    CURRENT BID
                    <span style={styles.reserveBadge}>• No Reserve</span>
                </div>
                <div style={styles.priceHero}>
                    ${currentPrice.toLocaleString()}
                </div>
            </div>

            {/* Action Zone */}
            <div style={styles.actionZone}>
                {!isActive || isEnded ? (
                    <div style={styles.statusBanner}>
                        AUCTION ENDED
                    </div>
                ) : isOwner ? (
                    <div style={styles.statusBannerOwned}>
                        YOU ARE THE SELLER
                    </div>
                ) : (
                    <form onSubmit={handleManualBid}>
                        <div style={styles.inputContainer} className="bid-focus">
                            <span style={styles.currencySymbol}>$</span>
                            <input
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                placeholder={minBid.toString()}
                                style={styles.input}
                            />
                            {!bidAmount && (
                                <button
                                    type="button"
                                    onClick={handleQuickBid}
                                    style={styles.quickFillBtn}
                                >
                                    Bid Min
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isDisabled}
                            style={{
                                ...styles.primaryBtn,
                                opacity: isDisabled ? 0.4 : 1,
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                backgroundColor: isCoolingDown ? "#4b5563" : "#111" // Visual feedback
                            }}
                        >
                            {auctionStore.isBidding
                                ? "Processing..."
                                : isCoolingDown
                                    // ✅ Display countdown here
                                    ? `Wait ${cooldown}s`
                                    : `Place Bid`
                            }
                        </button>

                        <div style={styles.finePrint}>
                            Minimum bid: <strong>${minBid.toLocaleString()}</strong>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
});

const styles = {
    card: {
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        marginBottom: "24px"
    },

    // --- Data Grid Header ---
    header: {
        display: "flex",
        backgroundColor: "#f9fafb",
        padding: "16px 24px",
        alignItems: "center"
    },
    headerItem: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "4px"
    },
    label: {
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase" as const,
        color: "#6b7280",
        letterSpacing: "0.5px"
    },
    value: {
        fontSize: "15px",
        fontWeight: 700,
        color: "#111",
        fontVariantNumeric: "tabular-nums"
    },
    headerDivider: {
        width: "1px",
        height: "24px",
        backgroundColor: "#e5e7eb",
        margin: "0 24px"
    },
    divider: {
        height: "1px",
        backgroundColor: "#e5e7eb",
        width: "100%"
    },

    // --- Hero Price Section ---
    heroSection: {
        padding: "32px 24px 24px",
        textAlign: "center" as const
    },
    currentBidLabel: {
        fontSize: "13px",
        fontWeight: 700,
        color: "#6b7280",
        letterSpacing: "1px",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px"
    },
    reserveBadge: {
        color: "#10b981",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: "#ecfdf5",
        padding: "2px 6px",
        borderRadius: "4px"
    },
    priceHero: {
        fontSize: "56px",
        fontWeight: 800,
        color: "#111",
        lineHeight: 1,
        letterSpacing: "-2px"
    },

    // --- Action Zone ---
    actionZone: {
        padding: "0 24px 32px"
    },
    inputContainer: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "4px 12px",
        marginBottom: "12px",
        transition: "border 0.2s, box-shadow 0.2s",
        height: "56px"
    },
    currencySymbol: {
        fontSize: "20px",
        fontWeight: 500,
        color: "#9ca3af",
        marginRight: "4px"
    },
    input: {
        flex: 1,
        border: "none",
        fontSize: "24px",
        fontWeight: 700,
        color: "#111",
        outline: "none",
        width: "100%",
        padding: 0
    },
    quickFillBtn: {
        fontSize: "12px",
        fontWeight: 600,
        color: "#2563eb",
        backgroundColor: "#eff6ff",
        border: "none",
        padding: "6px 12px",
        borderRadius: "20px",
        cursor: "pointer"
    },
    primaryBtn: {
        width: "100%",
        height: "56px",
        backgroundColor: "#111",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
        cursor: "pointer",
        transition: "all 0.2s"
    },
    finePrint: {
        marginTop: "12px",
        fontSize: "13px",
        color: "#6b7280",
        textAlign: "center" as const
    },

    // Status Banners
    statusBanner: {
        backgroundColor: "#f3f4f6",
        color: "#4b5563",
        fontWeight: 700,
        textAlign: "center" as const,
        padding: "16px",
        borderRadius: "8px",
        fontSize: "14px",
        letterSpacing: "0.5px"
    },
    statusBannerOwned: {
        backgroundColor: "#eff6ff",
        color: "#1d4ed8",
        fontWeight: 700,
        textAlign: "center" as const,
        padding: "16px",
        borderRadius: "8px",
        fontSize: "14px",
        letterSpacing: "0.5px"
    }
};