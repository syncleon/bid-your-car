import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

export const SellCarPage = observer(() => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
            <h1>Sell your car</h1>

            <p style={{ marginTop: 8, color: "#555" }}>
                Create an auction and start receiving bids from buyers.
            </p>

            <div
                style={{
                    marginTop: 32,
                    padding: 24,
                    border: "1px solid #eaeaea",
                    borderRadius: 8,
                    background: "#fafafa",
                }}
            >
                <h3>Ready to sell?</h3>

                <p style={{ margin: "8px 0 16px", color: "#666" }}>
                    You will be able to add photos, description, and set a
                    starting price.
                </p>

                <button
                    style={{
                        padding: "10px 20px",
                        borderRadius: 6,
                        border: "none",
                        background: "#000",
                        color: "#fff",
                        fontSize: 14,
                        cursor: "pointer",
                    }}
                    onClick={() => navigate("/sell-car/submit")}
                >
                    Sell now
                </button>
            </div>
        </div>
    );
});
