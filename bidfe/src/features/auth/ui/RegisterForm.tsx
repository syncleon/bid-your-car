import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useStore } from "../../../shared/hooks/useStore";

interface Props {
    onSwitchToLogin: () => void;
    onSuccess: () => void;
}

export const RegisterForm = observer(({ onSwitchToLogin }: Props) => {
    const { authStore } = useStore();
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });

    useEffect(() => () => {
        authStore.clearError();
        authStore.clearSuccessMessage();
    }, [authStore]);

    const submit = async () => {
        try {
            await authStore.register(formData);
            // We do NOT call onSuccess() here anymore.
            // We stay on this form to show the success message.
        } catch { /* empty */ }
    };

    // 1. SUCCESS STATE VIEW
    if (authStore.successMessage) {
        return (
            <div style={{ textAlign: "center", padding: "20px" }}>
                <h2 style={{ color: "green" }}>Registration Successful!</h2>
                <p>{authStore.successMessage}</p>
                <div style={{ marginTop: 20 }}>
                    <button onClick={() => {
                        authStore.clearSuccessMessage();
                        onSwitchToLogin();
                    }}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <h2>Register</h2>
            {authStore.error && (
                <div style={{ color: "red", marginBottom: 12 }}>{authStore.error}</div>
            )}

            <input
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <input
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <button onClick={submit} disabled={authStore.isLoading}>
                {authStore.isLoading ? "Registering..." : "Register"}
            </button>

            <p>
                Already have an account? <button onClick={onSwitchToLogin}>Login</button>
            </p>
        </>
    );
});