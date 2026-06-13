import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const [bidAmount, setBidAmount] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState("");
    const [isEndingSoon, setIsEndingSoon] = useState(false);
    const [progress, setProgress] = useState(0);
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
                setProgress(0);
                return setTimeLeft("Ended");
            }

            const underAnHour = diff < 3600000;
            setIsEndingSoon(underAnHour);
            if (underAnHour) {
                setProgress((diff / 3600000) * 100);
            }

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
                @keyframes flashBg {
                    0% { background-color: var(--color-success-border); }
                    100% { background-color: var(--bg-card); }
                }
                .metric-bar-inner.ending-soon {
                    position: relative;
                    overflow: hidden;
                }
                .ending-soon-text {
                    color: #3b82f6 !important;
                }
                .metric-bar-container {
                    display: flex;
                    gap: 16px;
                    align-items: stretch;
                }
                .metric-bar-inner {
                    display: flex;
                    flex: 1;
                    padding: 0 24px;
                    height: 52px;
                    border-radius: 8px;
                    background-color: #111;
                    align-items: center;
                    justify-content: space-between;
                }
                .metric-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
                    font-size: 15px;
                    white-space: nowrap;
                    position: relative;
                    z-index: 1;
                }
                .metric-item svg {
                    flex-shrink: 0;
                    opacity: 0.8;
                }
                .metric-item strong {
                    color: var(--text-primary);
                    font-weight: 700;
                    margin-left: 2px;
                }
                .place-bid-btn {
                    background-color: #3b82f6;
                    color: #fff;
                    padding: 0 32px;
                    height: 52px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    border: none;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .place-bid-btn:hover {
                    background-color: #2563eb;
                }
                .fast-bid-btn {
                    background-color: transparent;
                    color: #3b82f6;
                    padding: 0 24px;
                    height: 52px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    border: 2px solid #3b82f6;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .fast-bid-btn:hover:not(:disabled) {
                    background-color: rgba(59, 130, 246, 0.1);
                }
                .fast-bid-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    border-color: var(--text-muted);
                    color: var(--text-muted);
                }
            `}</style>

            <div className="metric-bar-container">
                <div className={`metric-bar-inner ${flash ? 'flash' : ''} ${isEndingSoon ? 'ending-soon' : ''}`}>
                    {isEndingSoon && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: `${progress}%`,
                            backgroundColor: 'rgba(59, 130, 246, 0.25)',
                            transition: 'width 1s linear',
                            zIndex: 0
                        }} />
                    )}
                    <div className="metric-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>Time Left</span>
                        <strong className={isEndingSoon ? 'ending-soon-text' : ''} style={{ fontVariantNumeric: 'tabular-nums' }}>{timeLeft || 'N/A'}</strong>
                    </div>

                    <div className="metric-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                        <span>High Bid</span>
                        <strong>${currentPrice.toLocaleString()}</strong>
                    </div>

                    <div className="metric-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
                        <span>Bids</span>
                        <strong>{auction.bidCount}</strong>
                    </div>
                </div>

                {isActive && !isEnded && !isOwner && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={handleOneClickQuickBid}
                            disabled={isQuickBtnDisabled}
                            className="fast-bid-btn"
                        >
                            {auctionStore.isBidding
                                ? "Wait..."
                                : isCoolingDown
                                    ? `Wait ${cooldown}s`
                                    : amIWinning 
                                        ? `Winning`
                                        : `Fast Bid $${minBid.toLocaleString()}`
                            }
                        </button>
                        <button className="place-bid-btn" onClick={() => setShowBidForm(!showBidForm)}>
                            {showBidForm ? "Close" : "Place Bid"}
                        </button>
                    </div>
                )}
            </div>

            {displayError && (
                <div style={{
                    marginTop: '12px',
                    backgroundColor: "var(--color-danger-bg)",
                    color: "var(--color-danger-text)",
                    border: "1px solid var(--color-danger-border)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    textAlign: "center"
                }}>
                    ⚠️ {displayError}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Ending {format(new Date(auction.endTime), "MMMM do 'at' h:mm a")}
                </div>
            </div>

            {showBidForm && isActive && !isEnded && !isOwner && (
                <div style={{
                    marginTop: '16px',
                    padding: '24px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={handleOneClickQuickBid}
                            disabled={isQuickBtnDisabled}
                            style={{
                                flex: 1,
                                height: '56px',
                                backgroundColor: 'var(--color-primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '16px',
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

                        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '12px' }}>OR</span>

                        <form onSubmit={handleManualBid} style={{ flex: 1.5, display: 'flex', gap: '8px', margin: 0 }}>
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '0 16px',
                                height: '56px'
                            }}>
                                <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '8px' }}>$</span>
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
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        width: '100%'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isManualBtnDisabled}
                                style={{
                                    height: '56px',
                                    padding: '0 24px',
                                    backgroundColor: 'var(--text-primary)',
                                    color: 'var(--bg-base)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    opacity: isManualBtnDisabled ? 0.4 : 1,
                                    cursor: isManualBtnDisabled ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Max Bid
                            </button>
                        </form>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Min inc: ${auction.minBidIncrement.toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
});