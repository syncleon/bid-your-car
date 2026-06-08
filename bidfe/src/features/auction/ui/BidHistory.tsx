import { formatDistanceToNow } from "date-fns";
import type { BidDto } from "../types";
import { useMemo } from "react";

export const BidHistory = ({ bids }: { bids: BidDto[] }) => {
    const processedBids = useMemo(() => {
        if (bids.length === 0) return [];
        const maxAmount = Math.max(...bids.map(b => b.amount));
        return bids
            .slice(-1000)
            .sort((a, b) => new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime())
            .map(bid => ({
                ...bid,
                isWinner: bid.amount === maxAmount
            }));
    }, [bids]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Bid History <span style={styles.count}>({bids.length})</span></h3>
            </div>

            <div style={styles.list} className="history-list-modern">
                {processedBids.length === 0 ? (
                    <div style={styles.empty}>No bids yet. Be the first!</div>
                ) : (
                    processedBids.map((bid) => (
                        <div key={bid.id} style={bid.isWinner ? styles.rowWinner : styles.row}>
                            <div style={styles.left}>
                                <span style={styles.name}>
                                    {bid.bidderName || "Anonymous"}
                                </span>
                                <span style={styles.date}>
                                    {formatDistanceToNow(new Date(bid.bidTime), { addSuffix: true })}
                                </span>
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
        display: "flex",
        flexDirection: "column" as const,
        maxHeight: "400px",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    header: {
        padding: "0 0 12px 0",
        borderBottom: "1px solid var(--border-color)",
        marginBottom: "8px",
        display: "flex",
        alignItems: "baseline",
        gap: "6px"
    },
    title: { margin: 0, fontSize: "12px", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase" as const, letterSpacing: "1px" },
    count: { fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 },

    list: { overflowY: "auto" as const, flex: 1, paddingRight: "4px" },
    empty: { padding: "20px 0", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" as const },

    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
    },
    rowWinner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        position: "sticky" as const,
        top: 0,
        backgroundColor: "var(--bg-card)",
        zIndex: 5,
        borderBottom: "1px dashed var(--border-color)",
        marginBottom: "4px"
    },

    left: { display: "flex", alignItems: "baseline", gap: "12px" },

    name: { fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" },
    date: { fontSize: "12px", color: "var(--text-muted)" },

    amount: { fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" },
    amountWinner: { fontSize: "13px", fontWeight: 700, color: "#3b82f6", fontVariantNumeric: "tabular-nums" } // Using standard primary blue for the modern trend look as seen in screenshot
};