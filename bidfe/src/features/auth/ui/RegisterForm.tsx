import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../../shared/hooks/useStore";
import { formStyles } from "./formStyles";

interface Props {
    onSwitchToLogin: () => void;
    onSuccess: () => void;
}

export const RegisterForm = observer(({ onSwitchToLogin }: Props) => {
    const { authStore } = useStore();
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });

    const submit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            await authStore.register(formData);
        } catch {
            // Error managed by store
        }
    };

    // Success View
    if (authStore.successMessage) {
        return (
            <div style={{ ...formStyles.container, textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                <h2 style={formStyles.header}>Account Created</h2>
                <p style={{ color: "#666", marginBottom: "32px", lineHeight: "1.5" }}>
                    {authStore.successMessage}
                </p>
                <button onClick={onSwitchToLogin} style={formStyles.primaryBtn}>
                    Continue to Login
                </button>
            </div>
        );
    }

    return (
        <div style={formStyles.container}>
            <h2 style={formStyles.header}>Create an account</h2>
            <p style={formStyles.subHeader}>Start your journey with us today.</p>

            {authStore.error && (
                <div style={formStyles.errorBanner}>{authStore.error}</div>
            )}

            <form onSubmit={submit}>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Username</label>
                    <input
                        style={formStyles.input}
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>

                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Email</label>
                    <input
                        style={formStyles.input}
                        placeholder="name@example.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Password</label>
                    <input
                        style={formStyles.input}
                        placeholder="Create a strong password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    {authStore.isLoading ? "Creating account..." : "Create account"}
                </button>
            </form>

            <div style={formStyles.footer}>
                <span style={{ color: "#666" }}>Already have an account? </span>
                <button onClick={onSwitchToLogin} style={formStyles.linkBtn}>
                    Log in
                </button>
            </div>
        </div>
    );
});