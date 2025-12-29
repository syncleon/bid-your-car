import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Modal } from "../shared/ui/Modal";
import { LoginForm } from "../features/auth/ui/LoginForm";
import { RegisterForm } from "../features/auth/ui/RegisterForm";

export const LoginPage = () => {
    const [mode, setMode] = useState<"login" | "register">("login");

    const navigate = useNavigate();
    const location = useLocation();

    const redirect =
        new URLSearchParams(location.search).get("redirect") || "/";

    const handleSuccess = () => {
        navigate(redirect, { replace: true });
    };

    return (
        <Modal isOpen onClose={() => navigate("/")}>
            {mode === "login" ? (
                <LoginForm
                    onSwitchToRegister={() => setMode("register")}
                    onSuccess={handleSuccess}
                />
            ) : (
                <RegisterForm
                    onSwitchToLogin={() => setMode("login")}
                    onSuccess={handleSuccess}
                />
            )}
        </Modal>
    );
};
