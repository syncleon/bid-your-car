import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../../shared/hooks/useStore";

interface Props {
    onSwitchToLogin: () => void;
    onSuccess: () => void;
}

/**
 * Component responsible for new user account creation.
 * Manages the registration state machine, including data submission
 * and the display of verification success messages.
 */
export const RegisterForm = observer(({ onSwitchToLogin }: Props) => {
    const { authStore } = useStore();
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });

    /**
     * Initiates the registration process using provided credentials.
     * On success, the store's successMessage state triggers the
     * post-registration view.
     */
    const submit = async () => {
        try {
            await authStore.register(formData);
        } catch {
            /* Error state managed by authStore */
        }
    };

    if (authStore.successMessage) {
        return (
            <div style={{ textAlign: "center", padding: "20px" }}>
                <h2 style={{ color: "green" }}>Registration Successful!</h2>
                <p>{authStore.successMessage}</p>
                <div style={{ marginTop: 20 }}>
                    <button onClick={onSwitchToLogin}>
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