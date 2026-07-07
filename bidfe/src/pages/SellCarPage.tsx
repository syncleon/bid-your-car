import { useNavigate, useLocation } from "react-router-dom";
import { useStoreContext } from "../app/providers/useStoreContext";
import { observer } from "mobx-react-lite";
import "./SellCarPage.css";
export const SellCarPage = observer(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const { authStore } = useStoreContext();

    return (
        <div style={{
            position: "relative",
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            color: "var(--text-primary)",
            overflow: "hidden"
        }}>
            {/* Background effect removed as requested */}
            <div style={{ position: "relative", zIndex: 1, maxWidth: "760px", textAlign: "center" }}>
                <h1 style={{
                    fontSize: "clamp(36px, 6vw, 56px)",
                    fontWeight: 700,
                    letterSpacing: "-1.5px",
                    lineHeight: 1.2,
                    marginBottom: "24px",
                    color: "var(--text-primary)"
                }}>
                    The modern way to sell.
                </h1>
                
                <p style={{
                    fontSize: "clamp(16px, 2vw, 20px)",
                    color: "var(--text-secondary)",
                    margin: "0 auto 32px",
                    lineHeight: 1.6,
                    fontWeight: 400
                }}>
                    Submit your premium vehicle in minutes. Our team curates your listing, and our dedicated audience bids in a transparent, 7-day auction. Maximum value, zero hassle.
                </p>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginBottom: "48px",
                    textAlign: "left"
                }}>
                    {[
                        { title: "1. Submit", desc: "Share photos and vehicle details easily." },
                        { title: "2. Curated", desc: "Our specialists review and refine your listing." },
                        { title: "3. Auction", desc: "Go live with 7 days of transparent bidding." }
                    ].map((step, idx) => (
                        <div key={idx} className="feature-card">
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>{step.title}</h3>
                            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.desc}</p>
                        </div>
                    ))}
                </div>
                
                <button
                    onClick={() => {
                        if (authStore.user) {
                            navigate("/sell-car/submit");
                        } else {
                            navigate("/login", { state: { backgroundLocation: location } });
                        }
                    }}
                    style={{
                        backgroundColor: "var(--btn-primary-bg)",
                        color: "var(--btn-primary-text)",
                        border: "none",
                        borderRadius: "4px",
                        padding: "0 32px",
                        height: "48px",
                        fontSize: "16px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    Start listing
                </button>
            </div>
        </div>
    );
});