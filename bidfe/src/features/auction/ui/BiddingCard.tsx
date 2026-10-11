import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Clock, TrendingUp, AlertCircle, CheckCircle, Gavel, Tag } from "lucide-react";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";

export const BiddingCard = observer(({ auction, isHorizontal = false }: { auction: AuctionDto, isHorizontal?: boolean }) => {
    const { auctionStore, authStore } = useStore();
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
    const currentWinnerId = auction.winnerId;
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
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
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

    const handlePlaceBid = async () => {
        setLocalError(null);
        auctionStore.clearError();

        if (isCoolingDown) return;
        if (!authStore.isAuthenticated) return setLocalError("Please log in to bid.");
        if (isOwner) return setLocalError("You cannot bid on your own item.");
        if (amIWinning) return setLocalError("You are already the highest bidder.");

        const result = await auctionStore.submitQuickBid(auction.id);
        if (result?.success) {
            setCooldown(2);
        } else if (result?.error) {
            setLocalError(result.error);
        }
    };

    const isBtnDisabled = auctionStore.isBidding || isCoolingDown;

    if (isHorizontal) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                padding: '16px 0',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '16px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Current Bid</span>
                        <span style={{ fontSize: '40px', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>${currentPrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '16px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}><Clock size={14} /> Time Left</span>
                        <span style={{ fontSize: '18px', fontWeight: 500, color: isEndingSoon && !isEnded ? '#ef4444' : 'var(--text-primary)' }}>{isEnded ? 'Ended' : timeLeft}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Bids number: {auction.bidCount}</span>
                    </div>
                </div>

                {!isEnded && isActive && !isOwner && (
                    <button
                        className={`btn-place-bid ${amIWinning ? 'winning' : ''}`}
                        onClick={handlePlaceBid}
                        disabled={isBtnDisabled}
                    >
                        {auctionStore.isBidding ? "Processing..." : isCoolingDown ? `Wait ${cooldown}s` : amIWinning ? `Winning` : `Place Bid`}
                    </button>
                )}
            </div>
        );
    }

    // Default Vertical Layout
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            flexGrow: 1
        }}>
            {/* Top Bar: Time Left & Bids */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '20px', color: 'white', fontWeight: 500, letterSpacing: '0.05em' }}><Clock size={20} />Time left</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: isEndingSoon && !isEnded ? '#ef4444' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                        {isEnded ? 'Ended' : timeLeft}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '20px', color: 'white', fontWeight: 500, letterSpacing: '0.05em' }}>Bids</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{auction.bidCount}</span>
                </div>
            </div>

            {/* Bidding Panel */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Current Price Hero */}
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', zIndex: 1 }}>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '30px', color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1px' }}>
                        {isEnded ? "Final Price" : "Current Bid"}
                    </span>
                    <span style={{ 
                        fontSize: '64px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1, 
                        letterSpacing: '-0.04em',
                        fontVariantNumeric: 'tabular-nums',
                        textShadow: '0 4px 24px rgba(0,0,0,0.4)'
                    }}>
                        ${currentPrice.toLocaleString()}
                    </span>
                    {amIWinning && !isEnded && (
                        <div style={{ marginTop: '16px', fontSize: '13px', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: '6px 12px', borderRadius: '100px' }}>
                            <CheckCircle size={14} /> You hold the highest bid
                        </div>
                    )}
                </div>

                {displayError && (
                    <div style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: 'rgba(153, 27, 27, 0.2)', padding: '8px 12px', borderRadius: '8px', zIndex: 1 }}>
                        <AlertCircle size={14} /> {displayError}
                    </div>
                )}

                {/* Bidding Controls */}
                {!isEnded && isActive && (
                    isOwner ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 'auto', textAlign: 'center', zIndex: 1 }}>
                            This is your listing.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 'auto', zIndex: 1 }}>
                            <button
                                className={`btn-place-bid ${amIWinning ? 'winning' : ''}`}
                                onClick={handlePlaceBid}
                                disabled={isBtnDisabled}
                            >
                                {auctionStore.isBidding ? "Processing..." : isCoolingDown ? `Wait ${cooldown}s` : amIWinning ? `Winning` : `Place Bid`}
                            </button>
                            
                            {!amIWinning && !isBtnDisabled && (
                                <span style={{ textAlign: 'center', fontSize: '16px', marginTop: '15px', fontWeight: 600 }}>
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
