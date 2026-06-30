import { formatDistanceToNow } from "date-fns";
import type { BidDto } from "../types";
import { useMemo } from "react";

export const BidHistory = ({ bids }: { bids: BidDto[] }) => {
    const highestBid = useMemo(() => {
        if (bids.length === 0) return null;
        return bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
    }, [bids]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Current Highest Bidder</h3>
            </div>

            <div style={styles.list} className="history-list-modern">
                {!highestBid ? (
                    <div style={styles.empty}>No bids yet. Be the first!</div>
                ) : (
                    <div style={styles.rowWinner}>
                        <div style={styles.left}>
                            <span style={styles.name}>
                                {highestBid.bidderName || "Anonymous"}
                            </span>
                            <span style={styles.date}>
                                {formatDistanceToNow(new Date(highestBid.bidTime), { addSuffix: true })}
                            </span>
                        </div>
                        <div style={styles.amountWinner}>
                            ${highestBid.amount.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column" as const,
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
    
    list: { paddingRight: "4px" },
    empty: { padding: "20px 0", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" as const },

    rowWinner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
    },

    left: { display: "flex", alignItems: "baseline", gap: "12px" },

    name: { fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" },
    date: { fontSize: "12px", color: "var(--text-muted)" },

    amountWinner: { fontSize: "13px", fontWeight: 700, color: "#3b82f6", fontVariantNumeric: "tabular-nums" } 
};