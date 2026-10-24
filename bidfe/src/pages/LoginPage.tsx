import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { GoogleAuthCard } from "../features/auth/ui/GoogleAuthCard";
import "./LoginPage.css";

interface LoginPageProps {
    isModal?: boolean;
}

export const LoginPage = ({ isModal = false }: LoginPageProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const handleClose = () => {
        const bg = location.state?.backgroundLocation;
        if (bg && bg.pathname !== "/login" && bg.pathname !== "/register") {
            navigate(`${bg.pathname}${bg.search || ""}${bg.hash || ""}`, { replace: true });
        } else {
            const redirect = searchParams.get("redirect");
            navigate(redirect || "/", { replace: true });
        }
    };

    return (
        <div
            className={isModal ? "login-modal-overlay" : "login-page-container"}
            onClick={handleClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="login-content-box"
            >
                {isModal && (
                    <button
                        onClick={handleClose}
                        className="login-close-btn"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                )}

                <GoogleAuthCard />
            </div>
        </div>
    );
};