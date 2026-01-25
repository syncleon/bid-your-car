import React from "react";
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
    onCancel: (id: string) => void; // New prop for cancelling
}

export const MyListingsSection = ({
                                      items,
                                      isLoading,
                                      onCreate,
                                      onEdit,
                                      onAuction,
                                      onDelete,
                                      onCancel
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
                    {items.map((item: ItemDto) => (
                        <div key={item.id} style={{ position: "relative" }}>
                            <ItemCard item={item} />

                            <div style={actionRow}>
                                {/* CASE 1: Item is available to be listed (Draft, Expired, Cancelled, or New) */}
                                {item.available && (
                                    <>
                                        <button onClick={() => onAuction(item)} style={auctionActionStyle}>
                                            List for Auction
                                        </button>
                                        <span style={{ color: '#eee' }}>|</span>
                                        <button onClick={() => onEdit(item)} style={actionLink}>
                                            Edit
                                        </button>
                                        <span style={{ color: '#eee' }}>|</span>
                                        <button
                                            onClick={() => {
                                                if(window.confirm("Are you sure you want to delete this car?")) {
                                                    onDelete(item.id);
                                                }
                                            }}
                                            style={{ ...actionLink, color: '#dc2626' }}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}

                                {/* CASE 2: Auction is currently LIVE */}
                                {item.active && (
                                    <button
                                        onClick={() => {
                                            if(window.confirm("Are you sure you want to cancel this active auction?")) {
                                                onCancel(item.id);
                                            }
                                        }}
                                        style={{ ...auctionActionStyle, color: '#dc2626' }}
                                    >
                                        Cancel Auction
                                    </button>
                                )}

                                {/* CASE 3: Item is SOLD */}
                                {item.sold && (
                                    <span style={soldLabelStyle}>
                                        Sold
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

// --- Styles ---

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

const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px 24px"
};

const actionRow: React.CSSProperties = {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: "13px",
    height: "20px" // Fix height to prevent jumping when buttons change
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

const soldLabelStyle: React.CSSProperties = {
    color: "#d97706", // Amber-600
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "default"
};