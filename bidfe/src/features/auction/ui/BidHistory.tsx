import { formatDistanceToNow } from "date-fns";
import type { BidDto } from "../types";

export const BidHistory = ({ bids }: { bids: BidDto[] }) => {
    // Sort: Highest first
    const sorted = [...bids].sort((a, b) => b.amount - a.amount);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Bid History</h3>
                <span style={styles.count}>{bids.length}</span>
            </div>

            <div style={styles.list}>
                {sorted.length === 0 ? (
                    <div style={styles.empty}>No bids yet. be the first!</div>
                ) : (
                    sorted.map((bid, i) => {
                        const isTop = i === 0;
                        return (
                            <div key={bid.id} style={isTop ? styles.rowTop : styles.row}>
                                <div style={styles.left}>
                                    {/* Avatar Placeholder */}
                                    <div style={isTop ? styles.avatarTop : styles.avatar}>
                                        {bid.bidderName ? bid.bidderName.charAt(0).toUpperCase() : "?"}
                                    </div>

                                    <div style={styles.info}>
                                        <div style={styles.nameRow}>
                                            <span style={styles.name}>
                                                {bid.bidderName || "Anonymous"}
                                            </span>
                                            {isTop && <span style={styles.badge}>HIGHEST</span>}
                                        </div>
                                        <div style={styles.date}>
                                            {formatDistanceToNow(new Date(bid.bidTime), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                                <div style={styles.amount}>
                                    ${bid.amount.toLocaleString()}
                                </div>
                            </div>
                        );
                    })
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
        maxHeight: "400px"
    },
    header: {
        padding: "16px 20px",
        borderBottom: "1px solid #f3f4f6",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff"
    },
    title: { margin: 0, fontSize: "14px", fontWeight: 700, color: "#111" },
    count: {
        fontSize: "12px",
        color: "#6b7280",
        background: "#f3f4f6",
        padding: "2px 8px",
        borderRadius: "10px",
        fontWeight: 600
    },

    list: { overflowY: "auto" as const, flex: 1 },
    empty: { padding: "40px", textAlign: "center" as const, color: "#9ca3af", fontSize: "13px" },

    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #f9fafb"
    },
    rowTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: "1px solid #f0fdf4",
        backgroundColor: "#fcfdfc"
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
    avatarTop: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "#16a34a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 700
    },

    info: { display: "flex", flexDirection: "column" as const, gap: "2px" },
    nameRow: { display: "flex", alignItems: "center", gap: "6px" },
    name: { fontSize: "13px", fontWeight: 600, color: "#374151" },

    badge: {
        fontSize: "9px",
        letterSpacing: "0.5px",
        color: "#16a34a",
        background: "#dcfce7",
        padding: "2px 4px",
        borderRadius: "4px",
        fontWeight: 800
    },

    date: { fontSize: "11px", color: "#9ca3af" },
    amount: { fontSize: "15px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }
};