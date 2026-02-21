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
        backgroundColor: "var(--bg-card)",
        borderRadius: "12px",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column" as const,
        maxHeight: "450px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    header: {
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "var(--bg-card)",
        position: "sticky" as const,
        top: 0,
        zIndex: 10
    },
    headerTitleGroup: { display: "flex", alignItems: "baseline", gap: "8px" },
    title: { margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" },
    limitLabel: { fontSize: "11px", color: "var(--text-muted)" },
    count: { fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-input)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 },

    list: { overflowY: "auto" as const, flex: 1 },
    empty: { padding: "40px", textAlign: "center" as const, color: "var(--text-muted)", fontSize: "13px" },

    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid var(--border-light)"
    },
    rowWinner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: "1px solid var(--color-warning-border)",
        backgroundColor: "var(--color-warning-bg)", // Yellow tinted background
        position: "sticky" as const,
        top: 0,
        zIndex: 5,
        borderLeft: "4px solid var(--color-warning-text)" // Yellow accent line
    },

    left: { display: "flex", alignItems: "center", gap: "12px" },

    avatar: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "var(--bg-input)",
        color: "var(--text-secondary)",
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
        background: "var(--bg-card)",
        border: "2px solid var(--color-warning-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px"
    },

    info: { display: "flex", flexDirection: "column" as const, gap: "2px" },
    nameRow: { display: "flex", alignItems: "center", gap: "6px" },
    name: { fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" },
    nameWinner: { fontSize: "14px", fontWeight: 700, color: "var(--color-warning-text)" }, // Yellow text

    winnerBadge: {
        fontSize: "9px",
        letterSpacing: "0.5px",
        color: "var(--bg-base)", // Inverted text
        background: "var(--color-warning-text)", // Yellow badge
        padding: "2px 6px",
        borderRadius: "4px",
        fontWeight: 900,
        textTransform: "uppercase" as const
    },

    date: { fontSize: "11px", color: "var(--text-muted)" },
    amount: { fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" },
    amountWinner: { fontSize: "18px", fontWeight: 800, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }
};