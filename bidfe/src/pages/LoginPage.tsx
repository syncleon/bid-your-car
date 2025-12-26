import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Modal } from "../shared/ui/Modal";
import { LoginForm } from "../features/auth/ui/LoginForm";
import { RegisterForm } from "../features/auth/ui/RegisterForm";

export const LoginPage = () => {
    const [mode, setMode] = useState<"login" | "register">("login");
    const navigate = useNavigate();

    return (
        <Modal isOpen onClose={() => navigate("/")}>
            {mode === "login" ? (
                <LoginForm
                    onSwitchToRegister={() => setMode("register")}
                    onSuccess={() => navigate("/")}
                />
            ) : (
                <RegisterForm
                    onSwitchToLogin={() => setMode("login")}
                    onSuccess={() => navigate("/")}
                />
            )}
        </Modal>
    );
};