import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";
import type { AuctionDto } from "../types";
import { minStyles } from "../../profile/ui/minimalStyles";

export const BiddingCard = observer(({ auction }: { auction: AuctionDto }) => {
    const { auctionStore, authStore } = useStore();
    const [bidAmount, setBidAmount] = useState<string>("");
    const [timeLeft, setTimeLeft] = useState("");

    // Calculate minimum next bid
    const currentPrice = auction.currentHighestBid || auction.startPrice;
    // If no bids yet, min bid is startPrice. If bids exist, must be price + increment.
    const minBid = auction.bidCount === 0
        ? auction.startPrice
        : currentPrice + auction.minBidIncrement;

    const isActive = auction.status === 'ACTIVE';
    const isEnded = new Date(auction.endTime).getTime() < Date.now();

    // Timer Logic
    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const end = new Date(auction.endTime).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("Auction Ended");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) setTimeLeft(`${days}d ${hours}h left`);
            else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [auction.endTime]);

    const handleBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authStore.isAuthenticated) {
            alert("Please log in to bid.");
            return;
        }

        const amount = Number(bidAmount);
        if (amount < minBid) {
            return; // Browser validation usually handles this via min attribute
        }

        const success = await auctionStore.submitBid({
            auctionId: auction.id,
            amount: amount
        });

        if (success) {
            setBidAmount(""); // Reset form
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <div>
                    <div style={styles.label}>Current Bid</div>
                    <div style={styles.price}>${currentPrice.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={styles.label}>Time Remaining</div>
                    <div style={{ ...styles.timer, color: isActive && !isEnded ? "#dc2626" : "#666" }}>
                        {timeLeft}
                    </div>
                </div>
            </div>

            <div style={styles.divider} />

            {/* Bidding Form */}
            {isActive && !isEnded ? (
                <form onSubmit={handleBid}>
                    {auctionStore.error && (
                        <div style={styles.error}>{auctionStore.error}</div>
                    )}

                    <div style={{ marginBottom: "12px" }}>
                        <div style={styles.helper}>
                            Minimum bid: <strong>${minBid.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <span style={styles.prefix}>$</span>
                            <input
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                min={minBid}
                                step={auction.minBidIncrement}
                                style={styles.input}
                                placeholder={minBid.toString()}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={auctionStore.isBidding}
                        style={{
                            ...minStyles.primaryBtn,
                            width: "100%",
                            opacity: auctionStore.isBidding ? 0.7 : 1
                        }}
                    >
                        {auctionStore.isBidding ? "Placing Bid..." : "Place Bid"}
                    </button>

                    <p style={styles.disclaimer}>
                        Bids are legally binding. A hold may be placed on your card.
                    </p>
                </form>
            ) : (
                <div style={styles.endedState}>
                    This auction has ended.
                    {auction.status === 'SOLD' && <div style={{color: '#16a34a', fontWeight: 'bold', marginTop: 8}}>SOLD for ${currentPrice.toLocaleString()}</div>}
                </div>
            )}
        </div>
    );
});

const styles = {
    card: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "20px"
    },
    label: { fontSize: "12px", textTransform: "uppercase" as const, color: "#666", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "4px" },
    price: { fontSize: "28px", fontWeight: 800, color: "#111", lineHeight: 1 },
    timer: { fontSize: "18px", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
    divider: { height: "1px", backgroundColor: "#f3f4f6", margin: "0 0 20px 0" },

    input: {
        width: "100%",
        padding: "12px 12px 12px 24px", // Space for $ prefix
        fontSize: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        outline: "none",
        fontWeight: 600
    },
    prefix: {
        position: "absolute" as const,
        marginTop: "12px",
        marginLeft: "12px",
        color: "#999",
        fontWeight: 600
    },
    helper: { fontSize: "13px", color: "#666", marginBottom: "8px" },
    error: { color: "#dc2626", fontSize: "13px", marginBottom: "12px", backgroundColor: "#fee2e2", padding: "8px", borderRadius: "6px" },
    disclaimer: { fontSize: "11px", color: "#9ca3af", textAlign: "center" as const, marginTop: "12px" },

    endedState: {
        textAlign: "center" as const,
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        color: "#666",
        fontWeight: 500
    }
};