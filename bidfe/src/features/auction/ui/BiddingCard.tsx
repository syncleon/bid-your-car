import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const [bidAmount, setBidAmount] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);
    const displayError = localError || auctionStore.error;
    const [cooldown, setCooldown] = useState(0);
    const isCoolingDown = cooldown > 0;
    const isActive = auction.status === 'ACTIVE';
    const isEnded = new Date(auction.endTime).getTime() < Date.now();
    const isOwner = authStore.user?.id === auction.item.seller.id;
    const currentPrice = auction.currentPrice || auction.startPrice;
    const minBid = auction.bidCount === 0 ? auction.startPrice : currentPrice + auction.minBidIncrement;

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

    useEffect(() => {
        if (!isCoolingDown) return;
        const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isCoolingDown]);

    useEffect(() => {
        if (displayError) {
            const timer = setTimeout(() => {
                setLocalError(null);
                auctionStore.clearError();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [displayError, auctionStore]);

    const submitBid = async (amount: number) => {
        setLocalError(null);
        auctionStore.clearError();

        if (isCoolingDown) return;
        if (!authStore.isAuthenticated) return setLocalError("Please log in to place a bid.");
        if (isOwner) return;
        if (amount < minBid) return setLocalError(`Bid must be at least $${minBid.toLocaleString()}`);

        const success = await auctionStore.submitBid(auction.id, amount);
        if (success) {
            setBidAmount("");
            setCooldown(5);
        }
    };

    const handleOneClickQuickBid = async () => {
        setLocalError(null);
        if (isCoolingDown) return;
        if (!authStore.isAuthenticated) return setLocalError("Please log in to bid.");
        if (isOwner) return;

        const result = await auctionStore.submitQuickBid(auction.id);
        if (result?.success) {
            setBidAmount("");
            setCooldown(5);
        } else if (result?.error) {
            setLocalError(result.error);
        }
    }

    const handleManualBid = (e: React.FormEvent) => {
        e.preventDefault();
        submitBid(Number(bidAmount));
    };

    const isValidBid = bidAmount !== "" && Number(bidAmount) >= minBid;
    const isManualBtnDisabled = auctionStore.isBidding || isCoolingDown || !isValidBid;
    const isQuickBtnDisabled = auctionStore.isBidding || isCoolingDown;
    const isUrgent = isActive && !isEnded && (new Date(auction.endTime).getTime() - Date.now() < 3600000);

    return (
        <div style={styles.card} className={isActive && !isEnded ? "bidding-card-active" : ""}>
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .bid-focus:focus-within { border-color: #000; box-shadow: 0 0 0 1px #000; }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div style={styles.header}>
                <div style={styles.headerItem}>
                    <span style={styles.label}>Time Left</span>
                    <span style={{
                        ...styles.value,
                        color: isUrgent ? "#dc2626" : "var(--text-primary)",
                        fontWeight: isUrgent ? 800 : 700,
                        display: "flex",
                        alignItems: "center"
                    }}>
                        {isUrgent && <span className="pulse-dot"></span>}
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

            <div style={styles.heroSection}>
                <div style={styles.currentBidLabel}>
                    CURRENT BID
                    {auction.item.isNoReserve && <span style={styles.reserveBadge}>• No Reserve</span>}
                </div>
                <div style={styles.priceHero}>
                    ${currentPrice.toLocaleString()}
                </div>
            </div>

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
                    <>
                        {displayError && (
                            <div style={styles.errorBanner}>
                                ⚠️ {displayError}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleOneClickQuickBid}
                            disabled={isQuickBtnDisabled}
                            className="btn-quick-bid"
                            style={{
                                width: "100%",
                                opacity: isQuickBtnDisabled ? 0.5 : 1,
                                cursor: isQuickBtnDisabled ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <span style={{ fontSize: '18px', display: 'block' }}>
                                {auctionStore.isBidding
                                    ? "Processing..."
                                    : isCoolingDown
                                        ? `Wait ${cooldown}s`
                                        : `Quick Bid $${minBid.toLocaleString()}`
                                }
                            </span>
                        </button>

                        <div style={styles.orDivider}>
                            <div style={styles.orLine} />
                            <span style={styles.orText}>OR PLACE CUSTOM BID</span>
                            <div style={styles.orLine} />
                        </div>

                        <form onSubmit={handleManualBid}>
                            <div style={styles.inputContainer} className="bid-focus">
                                <span style={styles.currencySymbol}>$</span>
                                <input
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder={minBid.toString()}
                                    style={styles.input}
                                    min={minBid}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isManualBtnDisabled}
                                className="btn-pill-primary"
                                style={{
                                    width: "100%",
                                    marginTop: "16px",
                                    opacity: isManualBtnDisabled ? 0.4 : 1,
                                    cursor: isManualBtnDisabled ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {auctionStore.isBidding
                                    ? "Processing..."
                                    : isCoolingDown
                                        ? `Wait ${cooldown}s`
                                        : `Place Bid`
                                }
                            </button>

                            <div style={styles.finePrint}>
                                Minimum increment: <strong>${auction.minBidIncrement.toLocaleString()}</strong>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
});

const styles = {
    card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.05)", marginBottom: "24px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
    header: { display: "flex", backgroundColor: "var(--bg-input)", padding: "16px 24px", alignItems: "center" },
    headerItem: { display: "flex", flexDirection: "column" as const, gap: "4px" },
    label: { fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, color: "var(--text-muted)", letterSpacing: "1px" },
    value: { fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" },
    headerDivider: { width: "1px", height: "24px", backgroundColor: "var(--border-color)", margin: "0 24px" },
    divider: { height: "1px", backgroundColor: "var(--border-color)", width: "100%" },
    heroSection: { padding: "36px 24px 24px", textAlign: "center" as const },
    currentBidLabel: { fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
    reserveBadge: { color: "var(--color-success-text)", fontSize: "11px", fontWeight: 700, backgroundColor: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", padding: "3px 8px", borderRadius: "6px", boxShadow: "0 0 10px var(--color-success-bg)" },
    priceHero: { fontSize: "64px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-2px", textShadow: "0 4px 12px rgba(0,0,0,0.5)" },
    actionZone: { padding: "0 24px 32px" },

    errorBanner: {
        backgroundColor: "var(--color-danger-bg)",
        color: "var(--color-danger-text)",
        border: "1px solid var(--color-danger-border)",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        marginBottom: "16px",
        textAlign: "center" as const,
        animation: "slideDown 0.3s ease-out"
    },

    quickBidMasterBtn: { width: "100%", height: "64px", border: "1px solid var(--border-color)", borderRadius: "8px", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.5px", transition: "all 0.2s" },
    orDivider: { display: "flex", alignItems: "center", margin: "24px 0", gap: "12px" },
    orLine: { flex: 1, height: "1px", backgroundColor: "var(--border-color)" },
    orText: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px" },
    inputContainer: { display: "flex", alignItems: "center", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "8px 16px", marginBottom: "16px", transition: "border 0.2s, box-shadow 0.2s", height: "64px" },
    currencySymbol: { fontSize: "24px", fontWeight: 600, color: "var(--text-muted)", marginRight: "8px" },
    input: { flex: 1, border: "none", fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", background: "transparent", outline: "none", width: "100%", padding: 0 },
    primaryBtn: { width: "100%", height: "56px", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", cursor: "pointer", transition: "all 0.2s" },
    finePrint: { marginTop: "12px", fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" as const },
    statusBanner: { backgroundColor: "var(--bg-input)", color: "var(--text-secondary)", fontWeight: 700, textAlign: "center" as const, padding: "16px", borderRadius: "8px", fontSize: "14px", letterSpacing: "0.5px" },
    statusBannerOwned: { backgroundColor: "var(--bg-hover)", color: "var(--accent-color)", border: "1px solid var(--border-color)", fontWeight: 700, textAlign: "center" as const, padding: "16px", borderRadius: "8px", fontSize: "14px", letterSpacing: "0.5px" }
};