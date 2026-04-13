import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../shared/api/HttpClient";

export const OAuth2SuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            // Call the backend to set the HttpOnly cookie safely
            http(`auth/oauth2-success?token=${token}`, { method: "GET" })
                .then(() => {
                    // Cookie is now saved! Redirect to profile.
                    navigate("/profile", { replace: true });
                })
                .catch((err) => {
                    console.error("OAuth2 setup failed", err);
                    navigate("/login", { replace: true });
                });
        } else {
            navigate("/login", { replace: true });
        }
    }, [navigate, searchParams]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
            <h2>Completing login...</h2>
        </div>
    );
};