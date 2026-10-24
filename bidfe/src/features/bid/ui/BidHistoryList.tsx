import { observer } from "mobx-react-lite";
import { formatDistanceToNow } from "date-fns";
import { Award, History, User } from "lucide-react";
import type { BidDto } from "../../auction/types";

interface Props {
    bids: BidDto[];
    isEnded?: boolean;
    isSold?: boolean;
}

export const BidHistoryList = observer(({ bids, isEnded = false, isSold = false }: Props) => {
    if (!bids || bids.length === 0) {
        return (
            <div
                style={{
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                }}
            >
                <History size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No bids placed yet</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>Be the first to place a bid on this listing.</p>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "20px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "12px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <History size={18} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                        Bid History
                    </span>
                    <span
                        style={{
                            padding: "2px 8px",
                            borderRadius: "100px",
                            fontSize: "12px",
                            fontWeight: 700,
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            color: "var(--text-muted)",
                        }}
                    >
                        {bids.length} {bids.length === 1 ? "bid" : "bids"}
                    </span>
                </div>

                {isEnded && isSold && (
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#4ade80",
                        }}
                    >
                        <Award size={14} /> Sold
                    </span>
                )}
            </div>

            {/* Scrollable Bids List */}
            <div
                className="history-list"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "360px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingRight: "6px",
                    paddingBottom: "6px",
                    scrollBehavior: "smooth",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
                }}
            >
                {bids.map((bid, index) => {
                    const isTopBid = index === 0;
                    const dateObj = new Date(bid.bidTime);
                    const timeAgo = Number.isNaN(dateObj.getTime())
                        ? ""
                        : formatDistanceToNow(dateObj, { addSuffix: true });

                    return (
                        <div
                            key={bid.id || `${bid.bidderId}-${bid.amount}-${index}`}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                backgroundColor: isTopBid
                                    ? "rgba(249, 115, 22, 0.08)"
                                    : "rgba(255, 255, 255, 0.02)",
                                border: isTopBid
                                    ? "1px solid rgba(249, 115, 22, 0.25)"
                                    : "1px solid rgba(255, 255, 255, 0.04)",
                                transition: "background 0.2s ease",
                            }}
                        >
                            {/* Bidder info */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        backgroundColor: isTopBid
                                            ? "rgba(249, 115, 22, 0.2)"
                                            : "rgba(255, 255, 255, 0.08)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: isTopBid ? "#f97316" : "var(--text-muted)",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {bid.bidderName ? bid.bidderName.substring(0, 2) : <User size={14} />}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            @{bid.bidderName || `user_${bid.bidderId}`}
                                        </span>
                                        {isTopBid && (
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    fontWeight: 700,
                                                    padding: "1px 6px",
                                                    borderRadius: "4px",
                                                    backgroundColor: isEnded
                                                        ? isSold
                                                            ? "rgba(74, 222, 128, 0.2)"
                                                            : "rgba(245, 158, 11, 0.2)"
                                                        : "rgba(249, 115, 22, 0.2)",
                                                    color: isEnded
                                                        ? isSold
                                                            ? "#4ade80"
                                                            : "#f59e0b"
                                                        : "#f97316",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {isEnded ? (isSold ? "Winning Bid" : "High Bid") : "Leading"}
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                        {timeAgo}
                                    </span>
                                </div>
                            </div>

                            {/* Amount */}
                            <span
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 700,
                                    color: isTopBid ? "var(--text-primary)" : "var(--text-secondary)",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                ${Number(bid.amount).toLocaleString()}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Scroll indicator for longer histories */}
            {bids.length > 5 && (
                <div
                    style={{
                        paddingTop: "6px",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                >
                    Showing all {bids.length} bids • Scroll to view full history
                </div>
            )}
        </div>
    );
});
