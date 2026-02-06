import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { formStyles } from "./formStyles";

export const LoginForm = observer(() => {
    const { authStore } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({ username: "", password: "" });

    useEffect(() => {
        authStore.reset();
    }, [authStore]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        await authStore.login(formData);

        if (!authStore.error) {
            const bg = location.state?.backgroundLocation;

            // FIX 1: Robust Navigation
            // Instead of navigate(-1), we explicitly go to the background path.
            // This ensures the modal closes even if the history stack is messy.
            if (bg) {
                navigate(bg.pathname, { replace: true });
            } else {
                navigate("/profile");
            }
        }
    };

    const handleRestore = async () => {
        await authStore.restore(formData);
    };

    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
        if (authStore.error && !authStore.isDeletedAccount) authStore.reset();
    };

    return (
        <div>
            <h2 style={formStyles.header}>Welcome back</h2>
            <p style={formStyles.subHeader}>Please enter your details to sign in.</p>

            {authStore.error && !authStore.isDeletedAccount && (
                <div style={formStyles.errorBanner}>{authStore.error}</div>
            )}

            {authStore.isDeletedAccount && (
                <div style={formStyles.warningBox}>
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#854d0e" }}>
                        This account is deactivated.
                    </p>
                    <button type="button" onClick={handleRestore} disabled={authStore.isLoading} style={formStyles.restoreBtn}>
                        {authStore.isLoading ? "Restoring..." : "Restore Account"}
                    </button>
                </div>
            )}

            <form onSubmit={submit}>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Username</label>
                    <input style={formStyles.input} placeholder="Enter your username" value={formData.username} onChange={(e) => handleChange("username", e.target.value)} />
                </div>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Password</label>
                    <input style={formStyles.input} type="password" placeholder="••••••••" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} />
                </div>
                <button type="submit" disabled={authStore.isLoading} style={{ ...formStyles.primaryBtn, opacity: authStore.isLoading ? 0.7 : 1 }}>
                    {authStore.isLoading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <div style={formStyles.footer}>
                <span style={{ color: "#666" }}>Don't have an account? </span>

                {/* FIX 2: Add replace={true} */}
                {/* This prevents adding a new history entry when switching forms */}
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