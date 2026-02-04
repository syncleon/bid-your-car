import type { BidResp } from "../types";

export const BidHistory = ({ bids }: { bids: BidResp[] }) => {

    if (bids.length === 0) {
        return (
            <div style={styles.container}>
                <h4 style={styles.title}>Bid History</h4>
                <div style={styles.empty}>No bids yet. Be the first!</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h4 style={styles.title}>Bid History ({bids.length})</h4>
            <div style={styles.list}>
                {bids.map((bid) => (
                    <div key={bid.id} style={styles.row}>
                        <div style={styles.user}>
                            <div style={styles.avatar}>
                                {bid.bidderName.charAt(0).toUpperCase()}
                            </div>
                            <span>{bid.bidderName}</span>
                        </div>
                        <div style={styles.amount}>
                            ${bid.amount.toLocaleString()}
                            <div style={styles.date}>
                                {new Date(bid.bidTime).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        marginTop: "24px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid #e5e7eb"
    },
    title: { margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700 },
    empty: { color: "#999", fontSize: "14px", fontStyle: "italic" },
    list: { display: "flex", flexDirection: "column" as const, gap: "16px" },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    user: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 600, color: "#333" },
    avatar: {
        width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#e2e8f0",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#64748b"
    },
    amount: { fontSize: "15px", fontWeight: 700, color: "#111", textAlign: "right" as const },
    date: { fontSize: "11px", color: "#999", fontWeight: 400, marginTop: "2px" }
};