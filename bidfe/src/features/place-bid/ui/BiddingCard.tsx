import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../../../entities/auction/types";
import { useAuctionTimer } from "../../../shared/hooks/useAuctionTimer";
import { styles } from "./styles";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const { timeLeft, isEnded, isUrgent } = useAuctionTimer(auction.endTime);
    const [bidAmount, setBidAmount] = useState<string>("");
    const [localError, setLocalError] = useState<string | null>(null);
    const displayError = localError || auctionStore.error;
    const [cooldown, setCooldown] = useState(0);
    const isCoolingDown = cooldown > 0;
    const isActive = auction.status === 'ACTIVE';
    const isOwner = authStore.user?.id === auction.item.seller.id;
    const currentPrice = auction.currentPrice || auction.startPrice;
    const minBid = auction.bidCount === 0 ? auction.startPrice : currentPrice + auction.minBidIncrement;    useEffect(() => {
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

    return (
        <div style={styles.card}>
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
                            style={{
                                ...styles.quickBidMasterBtn,
                                opacity: isQuickBtnDisabled ? 0.5 : 1,
                                cursor: isQuickBtnDisabled ? 'not-allowed' : 'pointer',
                                backgroundColor: isCoolingDown ? "var(--bg-input)" : "var(--btn-primary-bg)",
                                color: isCoolingDown ? "var(--text-muted)" : "var(--btn-primary-text)"
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
                                style={{
                                    ...styles.primaryBtn,
                                    opacity: isManualBtnDisabled ? 0.4 : 1,
                                    cursor: isManualBtnDisabled ? 'not-allowed' : 'pointer',
                                    backgroundColor: isCoolingDown ? "var(--bg-input)" : "var(--btn-primary-bg)",
                                    color: isCoolingDown ? "var(--text-muted)" : "var(--btn-primary-text)"
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