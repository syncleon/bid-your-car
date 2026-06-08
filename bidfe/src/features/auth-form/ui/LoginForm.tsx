import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { formStyles } from "./formStyles";

export const LoginForm = observer(() => {
    const { authStore } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const isVerified = queryParams.get("verified") === "true";

    const [formData, setFormData] = useState({ username: "", password: "" });

    useEffect(() => {
        authStore.reset();
    }, [authStore]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authStore.login(formData);

            const bg = location.state?.backgroundLocation;
            if (bg) {
                navigate(bg.pathname, { replace: true });
            } else {
                navigate("/profile");
            }
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleRestore = async () => {
        try {
            await authStore.restore(formData);
            const bg = location.state?.backgroundLocation;
            if (bg) {
                navigate(bg.pathname, { replace: true });
            } else {
                navigate("/profile");
            }
        } catch(error) {
            console.error("Restore failed", error);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
        if (authStore.error && !authStore.isDeletedAccount) {
            authStore.clearError();
        }
    };

    return (
        <div style={formStyles.container}>
            <h2 style={formStyles.header}>Welcome back</h2>
            <p style={formStyles.subHeader}>Please enter your details to sign in.</p>

            {isVerified && (
                <div style={formStyles.successBanner}>
                    Email successfully verified. You can now log in.
                </div>
            )}

            {authStore.error && !authStore.isDeletedAccount && (
                <div style={formStyles.errorBanner}>{authStore.error}</div>
            )}

            {authStore.isDeletedAccount && (
                <div style={formStyles.warningBox}>
                    <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#854d0e", fontWeight: 500 }}>
                        This account is deactivated.
                    </p>
                    <button type="button" onClick={handleRestore} disabled={authStore.isLoading} style={formStyles.restoreBtn}>
                        {authStore.isLoading ? "Restoring..." : "Restore Account"}
                    </button>
                </div>
            )}

            <form onSubmit={submit} autoComplete="off">
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Username</label>
                    <input
                        style={formStyles.input}
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => handleChange("username", e.target.value)}
                        autoComplete="off"
                        name="username_field"
                        required
                    />
                </div>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Password</label>
                    <input
                        style={formStyles.input}
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        autoComplete="new-password"
                        name="password_field"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={authStore.isLoading}
                    style={{ ...formStyles.primaryBtn, opacity: authStore.isLoading ? 0.7 : 1 }}>
                    {authStore.isLoading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <div style={formStyles.footer}>
                <span style={{ color: "#666" }}>Don't have an account? </span>
                <Link
                    to="/register"
                    replace={true}
                    state={{ backgroundLocation: location.state?.backgroundLocation }}
                    style={formStyles.linkBtn}
                >
                    Sign up
                </Link>
            </div>
        </div>
    );
});