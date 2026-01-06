import { ItemCard } from "../../item/ui/ItemCard";
import type { ItemDto } from "../../item/types";

interface Props {
    items: ItemDto[];
    isLoading: boolean;
    onCreate: () => void;
    onEdit: (item: ItemDto) => void;
    onDelete: (id: string) => void;
}

export const MyListingsSection = ({ items, isLoading, onCreate, onEdit, onDelete }: Props) => {
    return (
        <section style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>My Listings</h2>
                <button onClick={onCreate} style={primaryBtnStyle}>
                    + List New Car
                </button>
            </div>

            {isLoading ? (
                <p>Loading listings...</p>
            ) : items.length === 0 ? (
                <div style={emptyStateStyle}>
                    <p>You haven't listed any cars yet.</p>
                </div>
            ) : (
                <div style={gridStyle}>
                    {items.map(item => (
                        <div key={item.id} style={{ position: "relative" }}>
                            <ItemCard item={item} />

                            <div style={actionBarStyle}>
                                <button onClick={() => onEdit(item)} style={secondaryBtnStyle}>
                                    Edit
                                </button>
                                <button onClick={() => onDelete(item.id)} style={dangerActionBtnStyle}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

// Styles
const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 24
};

const emptyStateStyle: React.CSSProperties = {
    padding: 40,
    background: "#f9fafb",
    borderRadius: 8,
    textAlign: "center",
    color: "#6b7280",
    border: "1px dashed #d1d5db"
};

const actionBarStyle: React.CSSProperties = {
    marginTop: 12,
    display: "flex",
    gap: 12,
    justifyContent: "flex-end"
};

const primaryBtnStyle: React.CSSProperties = {
    background: "#000",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
};

const secondaryBtnStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #d1d5db",
    padding: "4px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13
};

const dangerActionBtnStyle: React.CSSProperties = {
    ...secondaryBtnStyle,
    color: "#dc2626",
    borderColor: "#fca5a5"
};