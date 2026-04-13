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

    const handleGoogleLogin = () => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bidyourcar.web.app';
        window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
    };

    return (
        <div style={formStyles.container}>
            <h2 style={formStyles.header}>Welcome back</h2>
            <p style={formStyles.subHeader}>Please enter your details to sign in.</p>

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

            <form onSubmit={submit}>
                <div style={formStyles.inputGroup}>
                    <label style={formStyles.label}>Username</label>
                    <input
                        style={formStyles.input}
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => handleChange("username", e.target.value)}
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
                        required
                    />
                </div>
                <button type="submit" disabled={authStore.isLoading} style={{ ...formStyles.primaryBtn, opacity: authStore.isLoading ? 0.7 : 1 }}>
                    {authStore.isLoading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <div style={{ textAlign: 'center', margin: '20px 0', color: '#666', fontSize: '14px' }}>
                or
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                style={{
                    ...formStyles.primaryBtn,
                    backgroundColor: '#fff',
                    color: '#333',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                }}
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" height="20" />
                Sign in with Google
            </button>

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