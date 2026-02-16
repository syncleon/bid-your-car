import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "../features/auth/ui/LoginForm";
import { RegisterForm } from "../features/auth/ui/RegisterForm";

interface LoginPageProps {
    isModal?: boolean;
}

export const LoginPage = ({ isModal = false }: LoginPageProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isRegister = location.pathname === "/register";

    const handleClose = () => {
        if (isModal) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    const modalOverlayStyle: React.CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
    };

    const pageContainerStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
    };

    const contentBoxStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: "440px",
        padding: "40px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: isModal ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" : "none",
        border: isModal ? "none" : "1px solid #f3f4f6",
        animation: isModal ? "fadeIn 0.2s ease-out" : "none"
    };

    const closeButtonStyle: React.CSSProperties = {
        position: "absolute",
        top: "16px",
        right: "20px",
        background: "none",
        border: "none",
        fontSize: "24px",
        cursor: "pointer",
        color: "#9ca3af",
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
                        onMouseEnter={(e) => e.currentTarget.style.color = "#111"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                    >
                        &times;
                    </button>
                )}

                {isRegister ? <RegisterForm /> : <LoginForm />}
            </div>
        </div>
    );
};