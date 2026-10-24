import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";

export const OAuthCallbackPage = () => {
    const { authStore } = useStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("auth_token", token);
        }

        // Wait for auth to resolve
        authStore.checkAuth().then(() => {
            navigate("/?setup_password=1", { replace: true });
            
            setTimeout(() => {
                if (!authStore.isAuthenticated) {
                    window.location.reload();
                }
            }, 500);
        }).catch(() => {
            navigate("/login", { replace: true });
        });
    }, [authStore, navigate, searchParams]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
            <h2>Logging you in...</h2>
        </div>
    );
};
