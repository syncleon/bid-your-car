import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../../shared/hooks/useStore";

interface Props {
    onSwitchToRegister: () => void;
    onSuccess: () => void;
}

/**
 * Component providing a user interface for authentication.
 * Handles standard login procedures and provides a recovery path
 * for accounts marked for soft-deletion.
 */
export const LoginForm = observer(({ onSwitchToRegister, onSuccess }: Props) => {
    const { authStore } = useStore();
    const [formData, setFormData] = useState({ username: "", password: "" });

    /**
     * Executes the standard authentication flow.
     * Redirects the user upon successful login.
     */
    const submit = async () => {
        try {
            await authStore.login(formData);
            onSuccess();
        } catch {
            /* Error state managed by authStore */
        }
    };

    /**
     * Triggers the account restoration process.
     * Displays a success message upon completion and waits
     * briefly before performing a redirect.
     */
    const handleRestore = async () => {
        await authStore.restore(formData);

        if (authStore.isAuthenticated) {
            setTimeout(() => {
                onSuccess();
            }, 2000);
        }
    };

    /**
     * Updates local form state and synchronizes global store messages.
     * Resets error and success states when the user modifies inputs.
     * * @param key The form field to update.
     * @param key
     * @param value The new value for the field.
     */
    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
        if (authStore.error || authStore.successMessage) authStore.reset();
    };

    return (
        <>
            <h2>Login</h2>

            {authStore.error && (
                <div style={{ color: "red", marginBottom: 12, padding: 8, border: "1px solid red", borderRadius: 4 }}>
                    {authStore.error}
                </div>
            )}

            {authStore.successMessage && (
                <div style={{
                    color: "#155724",
                    backgroundColor: "#d4edda",
                    marginBottom: 12,
                    padding: 10,
                    borderRadius: 4,
                    border: "1px solid #c3e6cb",
                    textAlign: "center"
                }}>
                    {authStore.successMessage}
                </div>
            )}

            {authStore.isDeletedAccount && !authStore.successMessage && (
                <div style={{ marginBottom: 20, textAlign: "center" }}>
                    <p style={{ fontSize: "0.9em", color: "#666" }}>
                        Your account is currently in the trash. <br/>
                        Would you like to recover it?
                    </p>
                    <button
                        onClick={handleRestore}
                        disabled={authStore.isLoading}
                        style={{ backgroundColor: "#52c41a", color: "white", width: "100%", padding: "8px", cursor: "pointer" }}
                    >
                        {authStore.isLoading ? "Restoring..." : "Yes, Restore Account"}
                    </button>
                    <hr style={{ margin: "20px 0", borderColor: "#eee" }}/>
                </div>
            )}

            <input
                placeholder="Username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
            />

            <input
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
            />

            <button onClick={submit} disabled={authStore.isLoading}>
                {authStore.isLoading ? "Logging in..." : "Login"}
            </button>

            <p>
                No account?{" "}
                <button onClick={onSwitchToRegister}>Register</button>
            </p>
        </>
    );
});