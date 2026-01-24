import React from "react";
import { Link } from "react-router-dom"; // ✅ Import Link
import { ItemCard } from "../../item/ui/ItemCard";
import type { ItemDto } from "../../item/types";
import { minStyles } from "./minimalStyles";

interface Props {
    items: ItemDto[];
    isLoading: boolean;
    onCreate: () => void;
    onEdit: (item: ItemDto) => void;
    onAuction: (item: ItemDto) => void;
    onDelete: (id: string) => void;
    onCancelAuction: (auctionId: string) => void; // ✅ New Handler
}

export const MyListingsSection = ({
                                      items,
                                      isLoading,
                                      onCreate,
                                      onEdit,
                                      onAuction,
                                      onDelete,
                                      onCancelAuction
                                  }: Props) => {
    return (
        <section style={{
            ...minStyles.section,
            borderBottom: '1px solid #eee',
            marginBottom: 12,
            paddingBottom: 24,
            paddingTop: 0,
            marginTop: 0
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ ...minStyles.header, marginBottom: 10 }}>My Garage</h2>
                <button onClick={onCreate} style={minStyles.primaryBtn}>
                    + Create New
                </button>
            </div>

            {isLoading ? (
                <p style={{ color: "#999" }}>Loading...</p>
            ) : items.length === 0 ? (
                <div style={{ padding: "24px 0", color: "#999", fontStyle: "italic" }}>
                    No active listings.
                </div>
            ) : (
                <div style={gridStyle}>
                    {items.map((item: ItemDto) => {
                        const isLive = !!item.activeAuctionId; // ✅ Check status

                        return (
                            <div key={item.id} style={{ position: "relative" }}>
                                <ItemCard item={item} />

                                <div style={actionRow}>
                                    {isLive ? (
                                        // --- 🟢 STATE: ACTIVE AUCTION ---
                                        <>
                                            <Link
                                                to={`/auctions/${item.activeAuctionId}`}
                                                style={liveLinkStyle}
                                            >
                                                <span style={liveDotStyle} />
                                                View Live
                                            </Link>

                                            <span style={{color: '#ddd'}}>|</span>

                                            <button
                                                onClick={() => onCancelAuction(item.activeAuctionId!)}
                                                style={cancelActionStyle}
                                                title="End auction early"
                                            >
                                                Cancel Auction
                                            </button>
                                        </>
                                    ) : (
                                        // --- ⚪ STATE: DRAFT / REGULAR ---
                                        <>
                                            <button onClick={() => onAuction(item)} style={auctionActionStyle}>
                                                List for Auction
                                            </button>

                                            <span style={{color: '#eee'}}>|</span>

                                            <button onClick={() => onEdit(item)} style={actionLink}>
                                                Edit
                                            </button>

                                            <span style={{color: '#eee'}}>|</span>

                                            <button onClick={() => onDelete(item.id)} style={{...actionLink, color: '#dc2626'}}>
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

// --- Styles ---

const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px 24px"
};

const actionRow: React.CSSProperties = {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: "13px",
    height: "20px" // Fixed height to prevent jumping when switching states
};

// --- Action Styles ---

const auctionActionStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#2563eb",
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};

const liveLinkStyle: React.CSSProperties = {
    textDecoration: "none",
    color: "#16a34a", // Green
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
};

const liveDotStyle: React.CSSProperties = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#16a34a",
    display: "block",
    boxShadow: "0 0 0 2px rgba(22, 163, 74, 0.2)"
};

const cancelActionStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#dc2626",
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};

const actionLink: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#666",
    fontWeight: 500,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};