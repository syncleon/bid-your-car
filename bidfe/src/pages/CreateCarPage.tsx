import { observer } from "mobx-react-lite";

export const SubmitItemPage = observer(() => {
    return (
        <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
            <h1>Create auction</h1>

            <p style={{ marginTop: 8, color: "#555" }}>
                Add car details and publish your auction.
            </p>

            <div
                style={{
                    marginTop: 24,
                    padding: 24,
                    border: "1px solid #eaeaea",
                    borderRadius: 8,
                    background: "#fafafa",
                }}
            >
                <p style={{ color: "#666" }}>
                    🚧 Form will be here:
                </p>

                <ul style={{ marginTop: 12, color: "#666" }}>
                    <li>Car details (brand, model, year)</li>
                    <li>Description</li>
                    <li>Photos upload</li>
                    <li>Starting price</li>
                    <li>Auction duration</li>
                </ul>

                <button
                    style={{
                        marginTop: 16,
                        padding: "10px 20px",
                        borderRadius: 6,
                        border: "none",
                        background: "#000",
                        color: "#fff",
                        fontSize: 14,
                        cursor: "pointer",
                    }}
                >
                    Publish auction
                </button>
            </div>
        </div>
    );
});