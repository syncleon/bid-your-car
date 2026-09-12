import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../shared/hooks/useStore";
import { Modal } from "../../shared/ui/Modal";

export const VerifyPage = observer(() => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { authStore } = useStore();

    useEffect(() => {
        if (token) {
            authStore.verify(token);
        }
    }, [token, authStore]);

    const handleClose = () => {
        authStore.clearSuccessMessage();
        authStore.clearError();
        navigate("/login");
    };

    return (
        <Modal isOpen onClose={handleClose}>
            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-primary)" }}>
                <h2>Account Verification</h2>

                {authStore.isLoading && <p style={{ color: "var(--text-secondary)" }}>Verifying your token...</p>}

                {authStore.error && (
                    <div>
                        <p style={{ color: "var(--color-danger-text)", fontWeight: 600 }}>Verification Failed</p>
                        <p style={{ color: "var(--text-secondary)" }}>{authStore.error}</p>
                        <button onClick={handleClose}>Close</button>
                    </div>
                )}

                {authStore.successMessage && (
                    <div>
                        <p style={{ color: "var(--color-success-text)", fontSize: "1.2em", fontWeight: 600 }}>
                            {authStore.successMessage}
                        </p>
                        <button onClick={handleClose}>Login Now</button>
                    </div>
                )}

                {!token && !authStore.isLoading && (
                    <p style={{ color: "var(--color-danger-text)", fontWeight: 600 }}>Invalid link.</p>
                )}
            </div>
        </Modal>
    );
});