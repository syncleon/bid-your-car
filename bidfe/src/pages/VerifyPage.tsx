import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore";
import { Modal } from "../shared/ui/Modal";

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
            <div style={{ textAlign: "center", padding: "20px" }}>
                <h2>Account Verification</h2>

                {authStore.isLoading && <p>Verifying your token...</p>}

                {authStore.error && (
                    <div>
                        <p style={{ color: "red" }}>Verification Failed</p>
                        <p>{authStore.error}</p>
                        <button onClick={handleClose}>Close</button>
                    </div>
                )}

                {authStore.successMessage && (
                    <div>
                        <p style={{ color: "green", fontSize: "1.2em" }}>
                            {authStore.successMessage}
                        </p>
                        <button onClick={handleClose}>Login Now</button>
                    </div>
                )}

                {!token && !authStore.isLoading && (
                    <p style={{ color: "red" }}>Invalid link.</p>
                )}
            </div>
        </Modal>
    );
});