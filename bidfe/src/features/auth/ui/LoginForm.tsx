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