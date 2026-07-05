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

            <div style={formStyles.divider}>
                <div style={formStyles.dividerLine}></div>
                <span style={formStyles.dividerText}>or</span>
                <div style={formStyles.dividerLine}></div>
            </div>

            <button
                type="button"
                onClick={() => window.location.href = '/oauth2/authorization/google'}
                style={formStyles.googleBtn}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Continue with Google
            </button>

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