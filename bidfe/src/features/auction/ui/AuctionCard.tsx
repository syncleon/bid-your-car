import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import type { AuctionDto } from "../types";

interface Props {
    auction: AuctionDto;
    viewMode?: "grid" | "list";
}


type CountdownTier = 'orange' | 'red' | null;

const tierStyles = {
    orange: {
        text: "#f97316",
        border: "1px solid rgba(249, 115, 22, 0.5)",
        progressBg: "linear-gradient(90deg, #ea580c, #f97316)",
    },
    red: {
        text: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.5)",
        progressBg: "linear-gradient(90deg, #dc2626, #ef4444)",
    },
};

const useAuctionTimer = (endTime?: string) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isEnded, setIsEnded] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [progressPercent, setProgressPercent] = useState<number>(100);
    const [tier, setTier] = useState<CountdownTier>(null);

    useEffect(() => {
        const calculate = () => {
            if (!endTime) {
                setIsEnded(true);
                setTimeLeft("N/A");
                setIsUrgent(false);
                setProgressPercent(0);
                setTier(null);
                return;
            }
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setIsEnded(true);
                setTimeLeft("Ended");
                setIsUrgent(false);
                setProgressPercent(0);
                setTier(null);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days >= 7) {
                const weeks = Math.floor(days / 7);
                setTimeLeft(`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`);
                setIsUrgent(false);
                setProgressPercent(100);
                setTier(null);
            } else if (days >= 1) {
                setTimeLeft(`${days} ${days === 1 ? 'day' : 'days'}`);
                setIsUrgent(false);
                setProgressPercent(100);
                setTier(null);
            } else {
                const h = String(hours).padStart(2, '0');
                const m = String(minutes).padStart(2, '0');
                const s = String(seconds).padStart(2, '0');
                setTimeLeft(`${h}:${m}:${s}`);

                // Progress bar countdown for the last 2 hours (7,200,000 ms):
                // - Orange (2h to 1h): 100% down to 50%
                // - Red    (1h to 0m):  50% down to 0%
                const TWO_HOURS_MS = 2 * 3600 * 1000;
                const ONE_HOUR_MS = 3600 * 1000;

                if (diff < ONE_HOUR_MS) {
                    setTier('red');
                    setIsUrgent(true);
                    const pct = Math.max(0, Math.min(50, (diff / TWO_HOURS_MS) * 100));
                    setProgressPercent(pct);
                } else if (diff < TWO_HOURS_MS) {
                    setTier('orange');
                    setIsUrgent(true);
                    const pct = Math.max(50, Math.min(100, (diff / TWO_HOURS_MS) * 100));
                    setProgressPercent(pct);
                } else {
                    setTier(null);
                    setIsUrgent(false);
                    setProgressPercent(100);
                }
            }
        };

        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return { timeLeft, isEnded, isUrgent, progressPercent, tier };
};


const formatPrice = (p: number) => `$${p.toLocaleString()}`;




export const AuctionCard = ({ auction, viewMode = "grid" }: Props) => {
    const { item, currentPrice, endTime, status } = auction;
    const { timeLeft, isEnded, progressPercent, tier } = useAuctionTimer(endTime);

    const firstImage = item.images?.[0];
    const mainImage = firstImage ? firstImage.url : item.thumbnailUrl;

    const isActive = status === 'ACTIVE';
    const isPending = status === 'PENDING_APPROVAL';
    const isSold = status === 'SOLD';
    return (
        <BaseCard
            to={`/auctions/${auction.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            isUrgent={tier === 'red' && isActive && !isEnded}
            viewMode={viewMode}
            overlays={{
                topLeft: (
                    <>
                        {isActive && !isEnded && (
                            <div style={{
                                background: "rgba(0, 0, 0, 0.8)",
                                color: "rgb(255, 255, 255)",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                letterSpacing: "0.5px"
                            }}
                            >
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-danger-text)", display: "block", transition: "background-color 0.3s" }}></span> Live
                            </div>
                        )}
                        {isPending && (
                            <div style={
                                {
                                    background: "rgba(0, 0, 0, 0.8)",
                                    color: "rgb(255, 255, 255)",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    letterSpacing: "0.5px"
                                }
                            }>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f59e0b", display: "block" }}></span> Pending
                            </div>
                        )}
                        {isSold && (
                            <div style={{ background: "rgba(0, 0, 0, 0.8)", color: "rgb(255, 255, 255)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-secondary)", display: "block" }}></span> Sold
                            </div>
                        )}
                        {!isSold && !isPending && isEnded && (
                            <div style={{ background: "rgba(0, 0, 0, 0.8)", color: "rgb(255, 255, 255)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-secondary)", display: "block" }}></span> Ended
                            </div>
                        )}
                    </>
                ),
                topRight: auction.isNoReserve ? (
                    <div
                        style={{
                            background: "rgba(0, 0, 0, 0.8)",
                            color: "rgb(255, 255, 255)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            letterSpacing: "0.5px"
                        }}
                    >
                        No reserve
                    </div>
                ) : undefined,
                bottomLeft: (
                    <div
                        style={{
                            background: "rgba(17, 17, 17, 0.75)",
                            backdropFilter: "blur(4px)",
                            padding: "6px 10px 8px 10px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#fff",
                            position: "relative",
                            overflow: "hidden",
                            border: tier && !isEnded ? tierStyles[tier].border : "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)"}}>
                                {isSold ? 'Sold' : isEnded ? 'Final' : 'Bid'}
                            </span>
                            <span style={{ fontSize: "15px"}}>{formatPrice(currentPrice)}</span>
                        </div>
                        <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.2)" }}></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: tier && !isEnded ? tierStyles[tier].text : "#fff" }}>
                            {isEnded ? <CheckCircleIcon /> : <Clock size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                            <span style={{ fontSize: "15px"}}>
                                {isEnded ? (isSold ? 'Sold' : 'Ended') : timeLeft}
                            </span>
                        </div>
                        {tier && !isEnded && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: "3px",
                                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${progressPercent}%`,
                                        background: tierStyles[tier].progressBg,
                                        transition: "width 1s linear",
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    gap: "4px",
                    paddingBottom: "2px",
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "8px 12px",
                        marginTop: "8px",
                        marginBottom: "4px",
                    }}
                >
                    {item.mileage !== undefined && item.mileage !== null && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                color: "var(--text-primary)",
                                fontWeight: 500,
                                overflow: "hidden",
                            }}
                        >
                            <GaugeIcon />
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.mileage.toLocaleString()} km
                            </span>
                        </div>
                    )}
                    {item.transmission && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                color: "var(--text-primary)",
                                fontWeight: 500,
                                overflow: "hidden",
                            }}
                        >
                            <CogIcon />
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.transmission}
                            </span>
                        </div>
                    )}
                    {(item.fuelType || item.engine) && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                color: "var(--text-primary)",
                                fontWeight: 500,
                                overflow: "hidden",
                            }}
                            title={[item.engine, item.fuelType].filter(Boolean).join(" • ")}
                        >
                            <GasPumpIcon />
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.engine || item.fuelType}
                            </span>
                        </div>
                    )}
                    {item.location && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                color: "var(--text-primary)",
                                fontWeight: 500,
                                overflow: "hidden",
                            }}
                        >
                            <MapPinIcon />
                            <span
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.location}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </BaseCard>
    );
};


const CheckCircleIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const GaugeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <path d="m12 14 4-4" />
        <path d="M3.34 16A10 10 0 1 1 20.66 16" />
    </svg>
);

const CogIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const GasPumpIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <path d="M3 22v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8"></path>
        <path d="M3 10V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
        <line x1="7" y1="12" x2="7" y2="12"></line>
        <path d="M11 22v-3a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1"></path>
        <path d="M21 22V10a2 2 0 0 0-2-2h-2"></path>
        <line x1="3" y1="22" x2="11" y2="22"></line>
    </svg>
);

const MapPinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);
