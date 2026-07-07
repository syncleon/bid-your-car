import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [bidAmount, setBidAmount] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState("");
    const [isEndingSoon, setIsEndingSoon] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const displayError = localError || auctionStore.error;
    const [cooldown, setCooldown] = useState(0);
    const [flash, setFlash] = useState(false);
    const [showBidForm, setShowBidForm] = useState(false);
    
    const isCoolingDown = cooldown > 0;
    const isActive = auction.status === 'ACTIVE';
    const isEnded = new Date(auction.endTime).getTime() < Date.now();
    const isOwner = authStore.user?.id === auction.item.seller.id;
    const currentPrice = auction.currentPrice || auction.startPrice;
    const minBid = auction.bidCount === 0 ? auction.startPrice : currentPrice + auction.minBidIncrement;
    const currentWinnerId = (auction as any).winningBid?.bidder?.id;
    const amIWinning = currentWinnerId === authStore.user?.id;
    const highestBid = auctionStore.bidHistory.length > 0 
        ? auctionStore.bidHistory.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) 
        : null;

    useEffect(() => {
        if (auction.bidCount > 0) {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 600);
            return () => clearTimeout(timer);
        }
    }, [auction.bidCount, auction.currentPrice]);

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const end = new Date(auction.endTime).getTime();
            const diff = end - now;
            if (diff <= 0) {
                setIsEndingSoon(false);
                return setTimeLeft("Ended");
            }

            const underAnHour = diff < 3600000;
            setIsEndingSoon(underAnHour);

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days} Days`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
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
            const match = displayError.match(/Wait (\d+) seconds/i);
            if (match) {
                setCooldown(parseInt(match[1], 10));
            }
            
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
        
        if (!amIWinning && amount < minBid) return setLocalError(`Bid must be at least $${minBid.toLocaleString()}`);

        const success = await auctionStore.submitBid(auction.id, amount);
        if (success) {
            setBidAmount("");
            setCooldown(2);
            setShowBidForm(false);
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
            setCooldown(2);
            setShowBidForm(false);
        } else if (result?.error) {
            setLocalError(result.error);
        }
    };

    const handleManualBid = (e: React.FormEvent) => {
        e.preventDefault();
        submitBid(Number(bidAmount));
    };

    const isValidBid = bidAmount !== "" && Number(bidAmount) >= minBid;
    const isManualBtnDisabled = auctionStore.isBidding || isCoolingDown || (!isValidBid && !amIWinning);
    const isQuickBtnDisabled = auctionStore.isBidding || isCoolingDown || amIWinning;

    // We don't have comments mapped to auctionStore yet

    return (
        <div style={{ position: "relative" }}>
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .flash { border-radius: 4px; padding: 0 4px; margin: 0 -4px; background-color: transparent; }
                .metric-bar-inner.ending-soon {
                    position: relative;
                    overflow: hidden;
                }
                .ending-soon-text {
                    color: var(--btn-secondary-bg) !important;
                }
                .bid-bar {
                    display: flex;
                    align-items: center;
                    padding: 8px 0;
                    margin-bottom: 16px;
                    gap: 24px;
                }
                .bid-bar-metrics {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    flex: 1;
                    flex-wrap: nowrap;
                }
                .bid-metric {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .bid-metric-label {
                    display: flex;
                    align-items: center;
                    font-family: 'Inter', sans-serif;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                }
                .bid-metric-value {
                    font-family: 'Inter', sans-serif;
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-primary);
                    font-variant-numeric: tabular-nums;
                }
                .bid-metric-value.large {
                    font-size: 24px;
                    line-height: 1;
                    letter-spacing: -0.5px;
                }
                .bid-bar-divider {
                    display: none;
                }
                .bid-bar-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-shrink: 0;
                }
                .place-bid-btn {
                    background-color: var(--color-primary);
                    color: var(--btn-primary-text);
                    padding: 0 24px;
                    height: 44px;
                    border-radius: 4px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    font-size: 14px;
                    border: none;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                    white-space: nowrap;
                }
                .place-bid-btn:hover { 
                    opacity: 0.9;
                }
                @media (max-width: 760px) {
                    .bid-bar { flex-direction: column; align-items: stretch; padding: 16px 0; gap: 20px; }
                    .bid-bar-actions { flex-direction: column; width: 100%; }
                    .fast-bid-btn, .place-bid-btn { width: 100%; }
                    .bid-bar-divider { display: none; }
                    .bid-bar-metrics { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 16px 12px; 
                        justify-content: start;
                    }
                }
            `}</style>

            <div className="bid-bar">
                <div className="bid-bar-metrics">
                    <div className="bid-metric">
                        <span className="bid-metric-label">High Bid</span>
                        <span className={`bid-metric-value large${flash ? ' flash' : ''}`}>${currentPrice.toLocaleString()}</span>
                    </div>

                    <div className="bid-metric">
                        <span className="bid-metric-label">Bidder</span>
                        <div className="bid-metric-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: "#3b82f6" }}>
                            {highestBid && (
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(highestBid.bidderName || 'A')}&background=3b82f6&color=fff&size=24`} alt="avatar" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                            )}
                            <span>{highestBid ? (highestBid.bidderName || "Anonymous") : "No bids"}</span>
                        </div>
                    </div>

                    <div className="bid-metric">
                        <span className="bid-metric-label">Time Left</span>
                        <span className={`bid-metric-value${isEndingSoon ? ' ending-soon-text' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{timeLeft || 'N/A'}</span>
                    </div>

                    <div className="bid-metric">
                        <span className="bid-metric-label">Bids</span>
                        <span className="bid-metric-value">{auction.bidCount}</span>
                    </div>
                </div>

                {isActive && !isEnded && !isOwner && (
                    <div className="bid-bar-actions">
                        {!authStore.isAuthenticated ? (
                            <button className="place-bid-btn" onClick={() => navigate('/login', { state: { backgroundLocation: location } })}>
                                Place Bid
                            </button>
                        ) : (
                            <>
                                <button className="place-bid-btn" onClick={() => setShowBidForm(!showBidForm)}>
                                    {showBidForm ? "Close" : "Place Bid"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {displayError && (
                <div style={{
                    marginTop: '12px',
                    backgroundColor: displayError.includes('highest bid') ? 'rgba(34, 197, 94, 0.1)' : "var(--color-danger-bg)",
                    color: displayError.includes('highest bid') ? '#22c55e' : "var(--color-danger-text)",
                    border: displayError.includes('highest bid') ? '1px solid rgba(34, 197, 94, 0.2)' : "1px solid var(--color-danger-border)",
                    padding: "12px 16px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>{displayError.includes('highest bid') ? '🏆' : '⚠️'}</span>
                    <span>{displayError}</span>
                </div>
            )}
            {showBidForm && isActive && !isEnded && !isOwner && authStore.isAuthenticated && (
                <div style={{
                    marginTop: '8px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
                        
                        {/* Quick Bid Column */}
                        <div style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            backgroundColor: 'var(--bg-input)', 
                            padding: '16px', 
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <button
                                type="button"
                                onClick={handleOneClickQuickBid}
                                disabled={isQuickBtnDisabled}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'var(--btn-primary-text)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    opacity: isQuickBtnDisabled ? 0.5 : 1,
                                    cursor: isQuickBtnDisabled ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {auctionStore.isBidding
                                    ? "Wait..."
                                    : isCoolingDown
                                        ? `Wait ${cooldown}s`
                                        : amIWinning 
                                            ? `Winning at $${currentPrice.toLocaleString()}`
                                            : `Quick Bid $${minBid.toLocaleString()}`
                                }
                            </button>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500, marginTop: '8px' }}>
                                Instantly places the minimum bid
                            </span>
                        </div>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontWeight: 800, fontSize: '13px' }}>
                            OR
                        </div>

                        {/* Custom Bid Column */}
                        <form onSubmit={handleManualBid} style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--bg-input)', 
                            padding: '16px', 
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            margin: 0
                        }}>
                            <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: 'var(--bg-base)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    padding: '0 12px',
                                    height: '44px'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '8px' }}>$</span>
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder={minBid.toString()}
                                        min={amIWinning ? currentPrice : minBid}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            width: '100%'
                                        }}
                                    />
                                </div>
                                <div
                                    title="Set a maximum limit and the system will bid automatically for you"
                                    style={{ display: 'flex', cursor: isManualBtnDisabled ? 'not-allowed' : 'pointer' }}
                                >
                                    <button
                                        type="submit"
                                        disabled={isManualBtnDisabled}
                                        style={{
                                            height: '44px',
                                            padding: '0 16px',
                                            backgroundColor: 'var(--text-primary)',
                                            color: 'var(--bg-base)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            opacity: isManualBtnDisabled ? 0.4 : 1,
                                            cursor: isManualBtnDisabled ? 'not-allowed' : 'pointer',
                                            pointerEvents: isManualBtnDisabled ? 'none' : 'auto'
                                        }}
                                    >
                                        Max Bid
                                    </button>
                                </div>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                                Minimum increment: ${auction.minBidIncrement.toLocaleString()}
                            </span>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
});