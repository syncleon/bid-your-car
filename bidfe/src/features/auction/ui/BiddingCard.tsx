import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Clock, TrendingUp, AlertCircle, CheckCircle, Zap } from "lucide-react";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction, isHorizontal = false }: { auction: AuctionDto, isHorizontal?: boolean }) => {
    const { auctionStore, authStore } = useStore();
    const [bidAmount, setBidAmount] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState("");
    const [isEndingSoon, setIsEndingSoon] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const displayError = localError || auctionStore.error;
    const [cooldown, setCooldown] = useState(0);
    
    const isCoolingDown = cooldown > 0;
    const isActive = auction.status === 'ACTIVE';
    const isEnded = new Date(auction.endTime).getTime() < Date.now();
    const isOwner = authStore.user?.id === auction.item.seller.id;
    const currentPrice = auction.currentPrice || auction.startPrice;
    const minBid = auction.bidCount === 0 ? auction.startPrice : currentPrice + auction.minBidIncrement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentWinnerId = (auction as any).winningBid?.bidder?.id;
    const amIWinning = currentWinnerId === authStore.user?.id;

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

    if (isHorizontal) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                width: '100%',
                gap: '12px'
            }}>
                {/* Left Side: Stats */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '32px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    padding: '16px 24px',
                    borderRadius: '6px',
                    flex: 1
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} color="#9ca3af" />
                        <span style={{ color: '#9ca3af', fontSize: '15px' }}>Time Left</span>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{timeLeft}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} color="#9ca3af" />
                        <span style={{ color: '#9ca3af', fontSize: '15px' }}>High Bid</span>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>${currentPrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#9ca3af', fontSize: '18px', fontWeight: 700 }}>#</span>
                        <span style={{ color: '#9ca3af', fontSize: '15px' }}>Bids</span>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{auction.bidCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span style={{ color: '#9ca3af', fontSize: '15px' }}>Comments</span>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>0</span>
                    </div>
                    {auction.isNoReserve && (
                        <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 'auto' }}>
                            No Reserve
                        </div>
                    )}
                </div>

                {/* Right Side: Action */}
                <button
                    onClick={() => {
                        const amt = prompt("Enter bid amount:", minBid.toString());
                        if (amt && !isNaN(Number(amt))) submitBid(Number(amt));
                    }}
                    disabled={isManualBtnDisabled && isQuickBtnDisabled}
                    style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        padding: '0 40px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '16px',
                        cursor: 'pointer',
                        opacity: (isManualBtnDisabled && isQuickBtnDisabled) ? 0.5 : 1
                    }}
                >
                    Place Bid
                </button>
            </div>
        );
    }

    // Default Vertical Layout
    return (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }} className="bidding-card-active">
            {/* TOP GROUP: Time/Bid, Stats, Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Header: Time Left & High Bid in a Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            <Clock size={12} color={isEndingSoon && !isEnded ? '#ef4444' : 'currentColor'} />
                            {isEnded ? "Status" : "Time Left"}
                        </span>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: isEndingSoon ? '#ef4444' : 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em', textShadow: isEndingSoon ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none' }}>
                            {isEnded ? "Ended" : timeLeft}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                            <TrendingUp size={12} />
                            {isEnded ? "Final Bid" : "Current Bid"}
                        </span>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                            ${currentPrice.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Bids & Comments count */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ backgroundColor: 'var(--bg-base)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{auction.bidCount}</span>
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Bids</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ backgroundColor: 'var(--bg-base)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>0</span>
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Comments</span>
                        </div>
                    </div>
                    {auction.isNoReserve && (
                        <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            No Reserve
                        </div>
                    )}
                </div>

                {displayError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '13px', fontWeight: 600, padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <AlertCircle size={16} />
                        {displayError}
                    </div>
                )}

                {amIWinning && !isEnded && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '13px', fontWeight: 700, padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <CheckCircle size={16} />
                        You are the highest bidder
                    </div>
                )}
            </div>

            {/* Bidding Controls */}
            {!isEnded && !isOwner && isActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <form onSubmit={handleManualBid} style={{ display: 'flex', gap: '8px', margin: 0, width: '100%', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 700, pointerEvents: 'none' }}>$</span>
                                <input
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder="Amount"
                                    min={amIWinning ? currentPrice : minBid}
                                    style={{
                                        width: '100%',
                                        height: '40px',
                                        backgroundColor: 'var(--bg-base)',
                                        border: '2px solid transparent',
                                        boxShadow: '0 0 0 1px var(--border-color)',
                                        borderRadius: '6px',
                                        padding: '0 12px 0 28px',
                                        color: 'var(--text-primary)',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--text-primary)'}
                                    onBlur={(e) => e.target.style.boxShadow = '0 0 0 1px var(--border-color)'}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isManualBtnDisabled}
                                style={{
                                    height: '40px',
                                    padding: '0 20px',
                                    backgroundColor: 'var(--text-primary)',
                                    color: 'var(--bg-base)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    opacity: isManualBtnDisabled ? 0.4 : 1,
                                    cursor: isManualBtnDisabled ? 'not-allowed' : 'pointer',
                                    transition: 'transform 0.1s, opacity 0.2s, box-shadow 0.2s',
                                    boxShadow: isManualBtnDisabled ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                                onMouseDown={(e) => { if(!isManualBtnDisabled) e.currentTarget.style.transform = 'scale(0.98)' }}
                                onMouseUp={(e) => { if(!isManualBtnDisabled) e.currentTarget.style.transform = 'scale(1)' }}
                                onMouseLeave={(e) => { if(!isManualBtnDisabled) e.currentTarget.style.transform = 'scale(1)' }}
                            >
                                Place Bid
                            </button>
                        </form>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                            <span>Minimum: ${minBid.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                    </div>

                    <button
                        onClick={handleOneClickQuickBid}
                        disabled={isQuickBtnDisabled}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#3b82f6',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: isQuickBtnDisabled ? 0.5 : 1,
                            cursor: isQuickBtnDisabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { if(!isQuickBtnDisabled) e.currentTarget.style.borderColor = 'var(--text-primary)' }}
                        onMouseLeave={(e) => { if(!isQuickBtnDisabled) e.currentTarget.style.borderColor = 'var(--border-color)' }}
                        onMouseDown={(e) => { if(!isQuickBtnDisabled) e.currentTarget.style.transform = 'scale(0.98)' }}
                        onMouseUp={(e) => { if(!isQuickBtnDisabled) e.currentTarget.style.transform = 'scale(1)' }}
                    >
                        <Zap size={18} fill="currentColor" />
                        {auctionStore.isBidding
                            ? "Processing..."
                            : isCoolingDown
                                ? `Wait ${cooldown}s`
                                : amIWinning 
                                    ? `Winning`
                                    : `1-Click Bid $${minBid.toLocaleString()}`
                        }
                    </button>
                </div>
            )}
        </div>
    );
});