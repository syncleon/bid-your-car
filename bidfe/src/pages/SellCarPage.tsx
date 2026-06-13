import { useNavigate } from "react-router-dom";

export const SellCarPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            position: "relative",
            width: "100%",
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "40px 24px",
            color: "var(--text-primary)",
            overflow: "hidden"
        }}>
            {}
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "80vw",
                height: "80vw",
                maxWidth: "800px",
                maxHeight: "800px",
                background: "radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 60%)",
                zIndex: 0,
                pointerEvents: "none"
            }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
                <h1 style={{
                    fontSize: "clamp(48px, 8vw, 84px)",
                    fontWeight: 800,
                    letterSpacing: "-2.5px",
                    lineHeight: 1.1,
                    marginBottom: "24px",
                    background: "linear-gradient(135deg, var(--text-primary) 30%, var(--text-muted) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}>
                    Curated. <br />
                    Transparent. <br />
                    Premium.
                </h1>
                
                <p style={{
                    fontSize: "clamp(18px, 2.5vw, 24px)",
                    color: "var(--text-secondary)",
                    maxWidth: "600px",
                    margin: "0 auto 48px",
                    lineHeight: 1.6,
                    fontWeight: 400
                }}>
                    Submit your vehicle to the world's most modern enthusiast auction platform. Create a stunning listing in minutes.
                </p>
                
                <button
                    onClick={() => navigate("/sell-car/submit")}
                    style={{
                        background: "linear-gradient(135deg, var(--color-primary) 0%, #475569 100%)",
                        color: "#ffffff",
                        padding: "18px 48px",
                        borderRadius: "50px",
                        border: "none",
                        fontSize: "18px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        cursor: "pointer",
                        boxShadow: "0 8px 30px rgba(37, 99, 235, 0.4)",
                        transition: "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 12px 40px rgba(37, 99, 235, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(37, 99, 235, 0.4)";
                    }}
                >
                    Start Your Listing
                </button>
            </div>
        </div>
    );
};