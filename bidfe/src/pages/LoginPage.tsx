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

    // 1. Handle closing the modal (go back)
    const handleClose = () => {
        // If it's a modal, go back one step in history to close it
        // If it's a full page, maybe go home
        if (isModal) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    // 2. Styles configuration
    const containerStyle: React.CSSProperties = isModal
        ? {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimmed background
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000, // Ensure it's on top
            backdropFilter: "blur(4px)" // Optional nice blur effect
        }
        : {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "#f5f5f5",
        };

    return (
        <div
            style={containerStyle}
            onClick={handleClose} // Click outside to close
        >
            <div
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside form
                style={{
                    position: "relative", // For positioning close button
                    width: "100%",
                    maxWidth: "400px",
                    padding: "40px",
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                    animation: isModal ? "fadeIn 0.2s ease-out" : "none"
                }}
            >
                {/* Optional Close Button (X) */}
                {isModal && (
                    <button
                        onClick={handleClose}
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "15px",
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#666"
                        }}
                    >
                        &times;
                    </button>
                )}

                {isRegister ? <RegisterForm /> : <LoginForm />}
            </div>
        </div>
    );
};