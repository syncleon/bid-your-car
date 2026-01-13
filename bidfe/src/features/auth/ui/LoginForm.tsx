import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../../shared/hooks/useStore";
import { formStyles } from "./formStyles"; // Assumed shared or defined below

interface Props {
    onSwitchToRegister: () => void;
    onSuccess: () => void;
}

export const LoginForm = observer(({ onSwitchToRegister, onSuccess }: Props) => {
    const { authStore } = useStore();
    const [formData, setFormData] = useState({ username: "", password: "" });

    const submit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            await authStore.login(formData);
            onSuccess();
        } catch {
            // Error managed by store
        }
    };

    const handleRestore = async () => {
        await authStore.restore(formData);
        if (authStore.isAuthenticated) {
            setTimeout(() => onSuccess(), 1500);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
        if (authStore.error || authStore.successMessage) authStore.reset();
    };

    return (
        <div style={formStyles.container}>
            <h2 style={formStyles.header}>Welcome back</h2>
            <p style={formStyles.subHeader}>Please enter your details to sign in.</p>

            {/* Error Message */}
            {authStore.error && (
                <div style={formStyles.errorBanner}>{authStore.error}</div>
            )}

            {/* Success Message */}
            {authStore.successMessage && (
                <div style={formStyles.successBanner}>{authStore.successMessage}</div>
            )}

            {/* Deleted Account Recovery UI */}
            {authStore.isDeletedAccount && !authStore.successMessage && (
                <div style={formStyles.warningBox}>
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#854d0e" }}>
                        This account is currently deactivated.
                    </p>
                    <button
                        onClick={handleRestore}
                        disabled={authStore.isLoading}
                        style={formStyles.restoreBtn}
                    >
                        {authStore.isLoading ? "Restoring..." : "Restore Account"}
                    </button>
                </div>
            )}

            {/* Main Form */}
            <form onSubmit={submit}>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Username</label>
                    <input
                        style={formStyles.input}
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => handleChange("username", e.target.value)}
                    />
                </div>

                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Password</label>
                    <input
                        style={formStyles.input}
                        placeholder="••••••••"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    onClick={submit}
                    disabled={authStore.isLoading}
                    style={{
                        ...formStyles.primaryBtn,
                        opacity: authStore.isLoading ? 0.7 : 1
                    }}
                >
                    {authStore.isLoading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <div style={formStyles.footer}>
                <span style={{ color: "#666" }}>Don't have an account? </span>
                <button onClick={onSwitchToRegister} style={formStyles.linkBtn}>
                    Sign up
                </button>
            </div>
        </div>
    );
});