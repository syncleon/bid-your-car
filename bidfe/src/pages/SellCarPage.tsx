import { useNavigate } from "react-router-dom";

export const SellCarPage = () => {
    const navigate = useNavigate();
    return (
        <div style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px" }}>
            <h1 style={{ fontSize: "42px", letterSpacing: "-1px", marginBottom: "16px" }}>Sell with us.</h1>
            <p style={{ color: "#666", maxWidth: "400px", lineHeight: "1.6", marginBottom: "32px" }}>
                Create a professional listing in minutes. Reach thousands of enthusiasts.
            </p>
            <button
                onClick={() => navigate("/sell-car/submit")}
                style={{ background: "#000", color: "#fff", padding: "14px 32px", borderRadius: "50px", border: "none", fontSize: "15px", fontWeight: 500, cursor: "pointer" }}
            >
                Start Listing
            </button>
        </div>
    );
};