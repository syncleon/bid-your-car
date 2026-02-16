import { formatDistanceToNow } from "date-fns";
import type { BidDto } from "../types";
import { useMemo } from "react";

export const BidHistory = ({ bids }: { bids: BidDto[] }) => {
    const processedBids = useMemo(() => {
        if (bids.length === 0) return [];

        // 1. Identify the single highest bid amount
        const maxAmount = Math.max(...bids.map(b => b.amount));

        // 2. Process last 1000, sorting by time (newest first)
        return bids
            .slice(-1000)
            .sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
            .map(bid => ({
                ...bid,
                isWinner: bid.amount === maxAmount // Mark the highest as winner
            }));
    }, [bids]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.headerTitleGroup}>
                    <h3 style={styles.title}>Bid History</h3>
                    {bids.length > 1000 && <span style={styles.limitLabel}>(Last 1000)</span>}
                </div>
                <span style={styles.count}>{bids.length} Bids</span>
            </div>

            <div style={styles.list}>
                {processedBids.length === 0 ? (
                    <div style={styles.empty}>No bids yet. Be the first!</div>
                ) : (
                    processedBids.map((bid) => (
                        <div key={bid.id} style={bid.isWinner ? styles.rowWinner : styles.row}>
                            <div style={styles.left}>
                                <div style={bid.isWinner ? styles.avatarWinner : styles.avatar}>
                                    {bid.isWinner ? "🏆" : (bid.bidderName?.charAt(0).toUpperCase() || "?")}
                                </div>

                                <div style={styles.info}>
                                    <div style={styles.nameRow}>
                                        <span style={bid.isWinner ? styles.nameWinner : styles.name}>
                                            {bid.bidderName || "Anonymous"}
                                        </span>
                                        {bid.isWinner && <span style={styles.winnerBadge}>CURRENT WINNER</span>}
                                    </div>
                                    <div style={styles.date}>
                                        {formatDistanceToNow(new Date(bid.bidTime), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                            <div style={bid.isWinner ? styles.amountWinner : styles.amount}>
                                ${bid.amount.toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column" as const,
        maxHeight: "450px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    header: {
        padding: "16px 20px",
        borderBottom: "1px solid #f3f4f6",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        position: "sticky" as const,
        top: 0,
        zIndex: 10
    },
    headerTitleGroup: { display: "flex", alignItems: "baseline", gap: "8px" },
    title: { margin: 0, fontSize: "14px", fontWeight: 700, color: "#111" },
    limitLabel: { fontSize: "11px", color: "#9ca3af" },
    count: { fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 },

    list: { overflowY: "auto" as const, flex: 1 },
    empty: { padding: "40px", textAlign: "center" as const, color: "#9ca3af", fontSize: "13px" },

    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #f9fafb"
    },
    rowWinner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: "1px solid #dcfce7",
        backgroundColor: "#f0fdf4", // Light green background
        position: "sticky" as const,
        top: 0, // Keeps winner visible at the top of the scrollable list
        zIndex: 5,
        borderLeft: "4px solid #16a34a" // Stronger green accent
    },

    left: { display: "flex", alignItems: "center", gap: "12px" },

    avatar: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "#f3f4f6",
        color: "#6b7280",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 700
    },
    avatarWinner: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#fef9c3", // Gold/Yellow background
        border: "2px solid #eab308",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px"
    },

    info: { display: "flex", flexDirection: "column" as const, gap: "2px" },
    nameRow: { display: "flex", alignItems: "center", gap: "6px" },
    name: { fontSize: "13px", fontWeight: 600, color: "#374151" },
    nameWinner: { fontSize: "14px", fontWeight: 700, color: "#166534" },

    winnerBadge: {
        fontSize: "9px",
        letterSpacing: "0.5px",
        color: "#ffffff",
        background: "#16a34a",
        padding: "2px 6px",
        borderRadius: "4px",
        fontWeight: 900,
        textTransform: "uppercase" as const
    },

    date: { fontSize: "11px", color: "#6b7280" },
    amount: { fontSize: "15px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" },
    amountWinner: { fontSize: "18px", fontWeight: 800, color: "#166534", fontVariantNumeric: "tabular-nums" }
};