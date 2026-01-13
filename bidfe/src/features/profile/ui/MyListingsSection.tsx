import { ItemCard } from "../../item/ui/ItemCard";
import type { ItemDto } from "../../item/types";
import { minStyles } from "./minimalStyles";
import React from "react";

interface Props {
    items: ItemDto[];
    isLoading: boolean;
    onCreate: () => void;
    onEdit: (item: ItemDto) => void;
    onDelete: (id: string) => void;
}

export const MyListingsSection = ({ items, isLoading, onCreate, onEdit, onDelete }: Props) => {
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
                <h2 style={{ ...minStyles.header, marginBottom: 10 }}>Profile</h2>
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
                    {items.map(item => (
                        <div key={item.id} style={{ position: "relative" }}>
                            <ItemCard item={item} />
                            <div style={actionRow}>
                                <button onClick={() => onEdit(item)} style={actionLink}>Edit</button>
                                <span style={{color: '#ddd'}}>|</span>
                                <button onClick={() => onDelete(item.id)} style={{...actionLink, color: '#dc2626'}}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px 24px"
};

const actionRow: React.CSSProperties = {
    marginTop: 8,
    display: "flex",
    gap: 12,
    fontSize: "13px"
};

const actionLink: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#666",
    fontWeight: 500
};