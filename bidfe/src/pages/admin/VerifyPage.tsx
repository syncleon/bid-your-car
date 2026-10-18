import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
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

    const handleGoHome = () => {
        authStore.clearSuccessMessage();
        authStore.clearError();
        navigate("/");
    };

    return (
        <Modal isOpen onClose={handleClose}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "36px 28px 28px 28px",
                    color: "var(--text-primary)",
                    minWidth: "360px",
                    maxWidth: "440px",
                }}
            >
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 20px 0", letterSpacing: "-0.5px" }}>
                    Account Verification
                </h2>

                {authStore.isLoading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                backgroundColor: "rgba(249, 115, 22, 0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Loader2 size={28} className="spinner" style={{ color: "var(--color-primary, #f97316)" }} />
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                            Please wait while we validate your activation token...
                        </p>
                    </div>
                )}

                {authStore.error && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <AlertTriangle size={28} style={{ color: "#ef4444" }} />
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#ef4444" }}>Verification Failed</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                            {authStore.error}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "12px" }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                                    transition: "all 0.25s ease",
                                }}
                            >
                                Back to Sign In
                            </button>
                            <button
                                onClick={handleGoHome}
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    background: "transparent",
                                    color: "var(--text-muted)",
                                    border: "none",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    transition: "color 0.2s ease",
                                }}
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                )}

                {authStore.successMessage && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                backgroundColor: "rgba(34, 197, 94, 0.15)",
                                border: "1px solid rgba(34, 197, 94, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <CheckCircle2 size={28} style={{ color: "#22c55e" }} />
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#22c55e" }}>Account Verified!</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                            {authStore.successMessage}
                        </p>
                        <button
                            onClick={handleClose}
                            style={{
                                width: "100%",
                                height: "44px",
                                marginTop: "12px",
                                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: "pointer",
                                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                                transition: "all 0.25s ease",
                            }}
                        >
                            Sign In to Your Account
                        </button>
                    </div>
                )}

                {!token && !authStore.isLoading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%" }}>
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                border: "1px solid rgba(245, 158, 11, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <AlertTriangle size={28} style={{ color: "#f59e0b" }} />
                        </div>
                        <p style={{ color: "var(--color-danger-text, #ef4444)", fontSize: "18px", fontWeight: 600, margin: 0 }}>
                            Invalid link.
                        </p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                            The verification link is missing a valid security token or has already expired.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "12px" }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                                    transition: "all 0.25s ease",
                                }}
                            >
                                Go to Sign In
                            </button>
                            <button
                                onClick={handleGoHome}
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    background: "transparent",
                                    color: "var(--text-muted)",
                                    border: "none",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    transition: "color 0.2s ease",
                                }}
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
});