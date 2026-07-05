import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { formStyles } from "./formStyles";

export const LoginForm = observer(() => {
    const { authStore } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [formData, setFormData] = useState({ username: "", password: "" });

    useEffect(() => {
        authStore.reset();
    }, [authStore]);

    // Resolve where to go after a successful login:
    // 1. ?redirect= param (set by PrivateRoute)
    // 2. backgroundLocation state (modal open from a page)
    // 3. fallback: home
    const getRedirectTarget = () => {
        const redirectParam = searchParams.get("redirect");
        if (redirectParam) return redirectParam;
        const bg = location.state?.backgroundLocation;
        if (bg && bg.pathname !== "/login" && bg.pathname !== "/register") {
            return `${bg.pathname}${bg.search || ""}${bg.hash || ""}`;
        }
        return "/";
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authStore.login(formData);
            navigate(getRedirectTarget(), { replace: true });
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleRestore = async () => {
        try {
            await authStore.restore(formData);
            navigate(getRedirectTarget(), { replace: true });
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
                <span style={{ color: "var(--text-secondary)" }}>Don't have an account? </span>
                <Link
                    to={`/register${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}
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