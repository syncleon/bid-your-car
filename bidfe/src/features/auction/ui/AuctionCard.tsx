import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { BaseCard, CardBadge, CardPricePill, CardSpecsGrid } from "../../../widgets/BaseCard/BaseCard";
import { CheckCircleIcon } from "../../../widgets/BaseCard/CardSpecsGrid";
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
                            <CardBadge dotColor="var(--color-danger-text)">Live</CardBadge>
                        )}
                        {isPending && (
                            <CardBadge dotColor="#f59e0b">Pending</CardBadge>
                        )}
                        {isSold && (
                            <CardBadge dotColor="var(--text-secondary)">Sold</CardBadge>
                        )}
                        {!isSold && !isPending && isEnded && (
                            <CardBadge dotColor="var(--text-secondary)">Ended</CardBadge>
                        )}
                    </>
                ),
                topRight: auction.isNoReserve ? (
                    <CardBadge>No reserve</CardBadge>
                ) : undefined,
                bottomLeft: (
                    <CardPricePill
                        priceLabel={isSold ? 'Winning Bid' : isEnded ? 'Final Bid' : 'Bid'}
                        priceValue={formatPrice(currentPrice)}
                        rightContent={
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: tier && !isEnded ? tierStyles[tier].text : "#fff" }}>
                                {isEnded ? <CheckCircleIcon /> : <Clock size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                                <span style={{ fontSize: "15px" }}>
                                    {isEnded ? (isSold ? 'Closed' : 'Ended') : timeLeft}
                                </span>
                            </div>
                        }
                        border={tier && !isEnded ? tierStyles[tier].border : undefined}
                        progressPercent={tier && !isEnded ? progressPercent : undefined}
                        progressBg={tier && !isEnded ? tierStyles[tier].progressBg : undefined}
                    />
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
                    marginTop: "auto",
                }}
            >
                <CardSpecsGrid
                    mileage={item.mileage}
                    transmission={item.transmission}
                    engineOrFuel={item.engine || item.fuelType}
                    location={item.location}
                />
            </div>
        </BaseCard>
    );
};
