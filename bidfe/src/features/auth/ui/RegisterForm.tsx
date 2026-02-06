import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { formStyles } from "./formStyles";

export const RegisterForm = observer(() => {
    const { authStore } = useStore();
    const location = useLocation();

    const [formData, setFormData] = useState({ username: "", email: "", password: "" });

    useEffect(() => {
        authStore.reset();
    }, [authStore]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        await authStore.register(formData);
    };

    if (authStore.successMessage) {
        return (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                <h2 style={formStyles.header}>Account Created</h2>
                <p style={{ color: "#666", marginBottom: "32px" }}>{authStore.successMessage}</p>

                {/* FIX: Add replace={true} here too */}
                <Link
                    to="/login"
                    replace={true}
                    state={{ backgroundLocation: location.state?.backgroundLocation }}
                    style={formStyles.primaryBtn}
                >
                    Continue to Login
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h2 style={formStyles.header}>Create an account</h2>
            <p style={formStyles.subHeader}>Start your journey with us today.</p>

            {authStore.error && (
                <div style={formStyles.errorBanner}>{authStore.error}</div>
            )}

            <form onSubmit={submit}>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Username</label>
                    <input style={formStyles.input} placeholder="Choose a username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Email</label>
                    <input style={formStyles.input} type="email" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Password</label>
                    <input style={formStyles.input} type="password" placeholder="Create a strong password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>

                <button type="submit" disabled={authStore.isLoading} style={{ ...formStyles.primaryBtn, opacity: authStore.isLoading ? 0.7 : 1 }}>
                    {authStore.isLoading ? "Creating account..." : "Create account"}
                </button>
            </form>

            <div style={formStyles.footer}>
                <span style={{ color: "#666" }}>Already have an account? </span>

                {/* FIX 2: Add replace={true} */}
                <Link
                    to="/login"
                    replace={true}
                    state={{ backgroundLocation: location.state?.backgroundLocation }}
                    style={formStyles.linkBtn}
                >
                    Log in
                </Link>
            </div>
        </div>
    );
});