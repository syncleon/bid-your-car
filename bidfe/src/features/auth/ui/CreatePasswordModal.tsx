import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Modal } from "../../../shared/ui/dialog/Modal";
import { setPassword } from "../../profile/api/profile.api";
import { getErrorMessage } from "../../../shared/utils/error";
import { Loader } from "../../../shared/ui/Loader/Loader";

interface CreatePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CreatePasswordModal: React.FC<CreatePasswordModalProps> = observer(({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const resp = await setPassword({ newPassword });
            setSuccessMessage(resp?.message || "Password created successfully");
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 2000);
        } catch (err: unknown) {
            setError(getErrorMessage(err) || "Failed to create password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Account Password">
            <div style={{ padding: "8px 0" }}>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Set a secure password for your account so you can also log in directly.
                </p>

                {error && (
                    <div style={{
                        color: "#ef4444",
                        fontSize: "14px",
                        marginBottom: "16px",
                        background: "rgba(239, 68, 68, 0.1)",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "1px solid rgba(239, 68, 68, 0.2)"
                    }}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div style={{
                        color: "#22c55e",
                        fontSize: "14px",
                        marginBottom: "16px",
                        background: "rgba(34, 197, 94, 0.1)",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "1px solid rgba(34, 197, 94, 0.2)"
                    }}>
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                            New Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "42px",
                                    padding: "0 40px 0 12px",
                                    background: "var(--bg-input, rgba(255,255,255,0.05))",
                                    border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
                                    borderRadius: "6px",
                                    color: "var(--text-primary, #fff)",
                                    fontSize: "14px",
                                    boxSizing: "border-box"
                                }}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    color: "var(--text-muted, #888)",
                                    display: "flex",
                                    alignItems: "center"
                                }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: "100%",
                                height: "42px",
                                padding: "0 12px",
                                background: "var(--bg-input, rgba(255,255,255,0.05))",
                                border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
                                borderRadius: "6px",
                                color: "var(--text-primary, #fff)",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                            required
                            minLength={6}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            style={{
                                padding: "10px 18px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-color, rgba(255,255,255,0.15))",
                                background: "transparent",
                                color: "var(--text-primary, #fff)",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "background 0.2s"
                            }}
                        >
                            Skip for now
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: "10px 20px",
                                borderRadius: "6px",
                                border: "none",
                                background: "var(--color-primary, #eab308)",
                                color: "#000",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: isLoading ? "not-allowed" : "pointer",
                                opacity: isLoading ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            {isLoading ? <Loader size="small" /> : "Set Password"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
});
