import { useState, useEffect } from "react";
import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import type { AuctionDto } from "../types";
import "./AuctionCard.css";

interface Props {
    auction: AuctionDto;
    viewMode?: "grid" | "list";
}

const useAuctionTimer = (endTime?: string) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isEnded, setIsEnded] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculate = () => {
            if (!endTime) {
                setIsEnded(true);
                setTimeLeft("N/A");
                setIsUrgent(false);
                return;
            }
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setIsEnded(true);
                setTimeLeft("Ended");
                setIsUrgent(false);
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
            } else if (days >= 1) {
                setTimeLeft(`${days} ${days === 1 ? 'day' : 'days'}`);
                setIsUrgent(false);
            } else {
                const h = String(hours).padStart(2, '0');
                const m = String(minutes).padStart(2, '0');
                const s = String(seconds).padStart(2, '0');
                setTimeLeft(`${h}:${m}:${s}`);
                setIsUrgent(hours < 1 && days === 0);
            }
        };

        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return { timeLeft, isEnded, isUrgent };
};


const formatPrice = (p: number) => `$${p.toLocaleString()}`;




export const AuctionCard = ({ auction, viewMode = "grid" }: Props) => {
    const { item, currentPrice, endTime, status } = auction;
    const { timeLeft, isEnded, isUrgent } = useAuctionTimer(endTime);

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
            isUrgent={isUrgent && isActive && !isEnded}
            viewMode={viewMode}
            overlays={{
                topLeft: (
                    <>
                        {isActive && !isEnded && (
                            <div style={{ background: "rgba(0, 0, 0, 0.8)", color: "rgb(255, 255, 255)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-danger-text)", display: "block", transition: "background-color 0.3s" }}></span> LIVE AUCTION
                            </div>
                        )}
                        {isPending && (
                            <div style={{ background: "rgba(0, 0, 0, 0.8)", color: "rgb(255, 255, 255)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f59e0b", display: "block" }}></span> PENDING
                            </div>
                        )}
                        {isSold && (
                            <div style={{ background: "rgba(0, 0, 0, 0.8)", color: "rgb(255, 255, 255)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-secondary)", display: "block" }}></span> SOLD
                            </div>
                        )}
                        {!isSold && !isPending && isEnded && (
                            <div style={{ background: "rgba(0, 0, 0, 0.8)", color: "rgb(255, 255, 255)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.5px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-secondary)", display: "block" }}></span> ENDED
                            </div>
                        )}
                    </>
                ),
                bottomLeft: (
                    <div style={{ background: "rgba(17, 17, 17, 0.75)", backdropFilter: "blur(4px)", padding: "6px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", color: "#fff", border: isUrgent && !isEnded ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)"}}>
                                {isSold ? 'Sold' : isEnded ? 'Final' : 'Bid'}
                            </span>
                            <span style={{ fontSize: "14px"}}>{formatPrice(currentPrice)}</span>
                        </div>
                        <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.2)" }}></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: isUrgent && !isEnded ? "#ef4444" : "#fff" }}>
                            {isEnded ? <CheckCircleIcon /> : (isUrgent ? <UrgentDot /> : <ClockIcon />)}
                            <span style={{ fontSize: "14px"}}>
                                {isEnded ? (isSold ? 'Sold' : 'Ended') : timeLeft}
                            </span>
                        </div>
                    </div>
                )
            }}
        >
            <div className="auction-card-body">
                <div className="auction-card-features">
                    {item.mileage !== undefined && item.mileage !== null && (
                        <div className="auction-feature-item">
                            <GaugeIcon />
                            <span className="truncate">{item.mileage.toLocaleString()} km</span>
                        </div>
                    )}
                    {item.transmission && (
                        <div className="auction-feature-item">
                            <CogIcon />
                            <span className="truncate">{item.transmission}</span>
                        </div>
                    )}
                    {(item.fuelType || item.engine) && (
                        <div className="auction-feature-item">
                            <GasPumpIcon />
                            <span className="truncate">
                                {[item.fuelType, item.engine].filter(Boolean).join(", ")}
                            </span>
                        </div>
                    )}
                    {item.location && (
                        <div className="auction-feature-item">
                            <MapPinIcon />
                            <span className="truncate">{item.location}</span>
                        </div>
                    )}
                </div>
            </div>
        </BaseCard>
    );
};


const ClockIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const UrgentDot = () => (
    <span className="urgent-dot" />
);

const CheckCircleIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const GaugeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 14 4-4" />
        <path d="M3.34 16A10 10 0 1 1 20.66 16" />
    </svg>
);

const CogIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const GasPumpIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8"></path>
        <path d="M3 10V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
        <line x1="7" y1="12" x2="7" y2="12"></line>
        <path d="M11 22v-3a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1"></path>
        <path d="M21 22V10a2 2 0 0 0-2-2h-2"></path>
        <line x1="3" y1="22" x2="11" y2="22"></line>
    </svg>
);

const CarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
    </svg>
);

const PaletteIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5"></circle>
        <circle cx="17.5" cy="10.5" r=".5"></circle>
        <circle cx="8.5" cy="7.5" r=".5"></circle>
        <circle cx="6.5" cy="12.5" r=".5"></circle>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
    </svg>
);

const MapPinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const ZapIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
);

const BoxIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

const StarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const SofaIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
        <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
        <path d="M4 18v2" />
        <path d="M20 18v2" />
        <path d="M12 4v9" />
    </svg>
);
