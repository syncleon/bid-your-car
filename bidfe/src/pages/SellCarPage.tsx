import { useNavigate } from "react-router-dom";

export const SellCarPage = () => {
    const navigate = useNavigate();
    return (
        <div style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px", color: "var(--text-primary)" }}>
            <h1 style={{ fontSize: "42px", letterSpacing: "-1px", marginBottom: "16px" }}>Sell with us.</h1>
            <p style={{ color: "var(--text-secondary)", maxWidth: "400px", lineHeight: "1.6", marginBottom: "32px" }}>
                Create a professional listing in minutes. Reach thousands of enthusiasts.
            </p>
            <button
                onClick={() => navigate("/sell-car/submit")}
                style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", padding: "14px 32px", borderRadius: "50px", border: "none", fontSize: "15px", fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease" }}
            >
                Start Listing
            </button>
        </div>
    );
};