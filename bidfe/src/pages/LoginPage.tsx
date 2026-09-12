import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "../features/auth/ui/LoginForm";
import { RegisterForm } from "../features/auth/ui/RegisterForm";

interface LoginPageProps {
    isModal?: boolean;
}

export const LoginPage = ({ isModal = false }: LoginPageProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isRegister = location.pathname === "/register";

    const handleClose = () => {
        const bg = location.state?.backgroundLocation;
        if (bg && bg.pathname !== "/login" && bg.pathname !== "/register") {
            navigate(`${bg.pathname}${bg.search || ""}${bg.hash || ""}`, { replace: true });
        } else {
            const redirect = searchParams.get("redirect");
            navigate(redirect || "/", { replace: true });
        }
    };

    const modalOverlayStyle: React.CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "var(--bg-overlay)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
        transition: "background-color 0.3s ease",
    };

    const pageContainerStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        transition: "background-color 0.3s ease",
        padding: "16px",
        boxSizing: "border-box"
    };

    const contentBoxStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: "440px",
        padding: "clamp(24px, 5vw, 40px)",
        backgroundColor: "var(--bg-card)",
        borderRadius: "6px",
        boxShadow: isModal ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" : "none",
        border: isModal ? "1px solid var(--border-color)" : "1px solid var(--border-color)",
        animation: isModal ? "fadeIn 0.2s ease-out" : "none",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
    };

    const closeButtonStyle: React.CSSProperties = {
        position: "absolute",
        top: "16px",
        right: "20px",
        background: "none",
        border: "none",
        fontSize: "24px",
        cursor: "pointer",
        color: "var(--text-muted)",
        transition: "color 0.2s"
    };

    const containerStyle = isModal ? modalOverlayStyle : pageContainerStyle;

    return (
        <div style={containerStyle} onClick={handleClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={contentBoxStyle}
            >
                {isModal && (
                    <button
                        onClick={handleClose}
                        style={closeButtonStyle}
                        aria-label="Close"
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} 
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"} 
                    >
                        &times;
                    </button>
                )}

                {isRegister ? <RegisterForm /> : <LoginForm />}
            </div>
        </div>
    );
};