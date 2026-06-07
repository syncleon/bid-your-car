import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { formStyles } from "./formStyles";

export const RegisterForm = observer(() => {
    const { authStore } = useStore();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const redirectParam = searchParams.get("redirect") ?? "";

    const [formData, setFormData] = useState({ username: "", email: "", password: "" });

    useEffect(() => {
        authStore.reset();
    }, [authStore]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authStore.register(formData);
        } catch (error) {
            console.error("Registration failed", error);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
        if (authStore.error) {
            authStore.clearError();
        }
    };

    if (authStore.successMessage) {
        return (
            <div style={{ ...formStyles.container, textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: "48px", margin: "0 0 16px 0" }}>🎉</div>
                <h2 style={formStyles.header}>Account Created</h2>
                <p style={{ ...formStyles.subHeader, margin: "0 0 32px 0" }}>{authStore.successMessage}</p>

                <Link
                    to={`/login${redirectParam ? `?redirect=${redirectParam}` : ""}`}
                    replace={true}
                    state={{ backgroundLocation: location.state?.backgroundLocation }}
                    style={{ ...formStyles.primaryBtn, display: "inline-block", textDecoration: "none", boxSizing: "border-box" }}
                >
                    Continue to Login
                </Link>
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
                        onChange={(e) => handleChange("username", e.target.value)}
                        required
                    />
                </div>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Email</label>
                    <input
                        style={formStyles.input}
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                    />
                </div>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Password</label>
                    <input
                        style={formStyles.input}
                        type="password"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <button type="submit" disabled={authStore.isLoading} style={{ ...formStyles.primaryBtn, opacity: authStore.isLoading ? 0.7 : 1 }}>
                    {authStore.isLoading ? "Creating account..." : "Create account"}
                </button>
            </form>

            <div style={formStyles.footer}>
                <span style={{ color: "var(--text-secondary)" }}>Already have an account? </span>
                <Link
                    to={`/login${redirectParam ? `?redirect=${redirectParam}` : ""}`}
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