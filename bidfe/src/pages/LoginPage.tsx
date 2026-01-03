import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Modal } from "../shared/ui/Modal";
import { LoginForm } from "../features/auth/ui/LoginForm";
import { RegisterForm } from "../features/auth/ui/RegisterForm";
import { useStore } from "../shared/hooks/useStore";

/**
 * Page component that serves as the entry point for user authentication.
 * Manages the high-level state between login and registration views within a modal,
 * ensuring the global auth store is reset during transitions and closures.
 */
export const LoginPage = () => {
    const { authStore } = useStore();
    const [mode, setMode] = useState<"login" | "register">("login");
    const navigate = useNavigate();
    const location = useLocation();

    const redirect = new URLSearchParams(location.search).get("redirect") || "/";

    /**
     * Finalizes the authentication process upon success.
     * Cleans up transient store states before navigating the user
     * to their intended destination.
     */
    const handleSuccess = () => {
        authStore.reset();
        navigate(redirect, { replace: true });
    };

    /**
     * Handles the dismissal of the authentication modal.
     * Resets the auth store to prevent stale errors or messages
     * from appearing when the modal is reopened.
     */
    const handleClose = () => {
        authStore.reset();
        navigate("/");
    };

    /**
     * Transitions the view to the registration form.
     * Clears any existing login errors before switching modes.
     */
    const switchToRegister = () => {
        authStore.reset();
        setMode("register");
    };

    /**
     * Transitions the view to the login form.
     * Clears any existing registration success or error messages before switching modes.
     */
    const switchToLogin = () => {
        authStore.reset();
        setMode("login");
    };

    return (
        <Modal isOpen onClose={handleClose}>
            {mode === "login" ? (
                <LoginForm
                    onSwitchToRegister={switchToRegister}
                    onSuccess={handleSuccess}
                />
            ) : (
                <RegisterForm
                    onSwitchToLogin={switchToLogin}
                    onSuccess={handleSuccess}
                />
            )}
        </Modal>
    );
};