import { useState } from "react";
import { Modal } from "../../../shared/ui/Modal";

interface Props {
    onConfirmDelete: (password: string) => Promise<void>;
}

export const AccountDeleteCard = ({ onConfirmDelete }: Props) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!password) {
            setError("Password is required");
            return;
        }
        try {
            await onConfirmDelete(password);
            setModalOpen(false);
        } catch (e: any) {
            setError(e.message || "Failed to delete account");
        }
    };

    return (
        <>
            <section style={{ border: "1px solid #ffccc7", padding: 24, borderRadius: 8, background: "#fff1f0" }}>
                <h2 style={{ color: "#cf1322", marginTop: 0, fontSize: 18 }}>Delete Account</h2>
                <p style={{ fontSize: 14, color: "#666" }}>
                    Once you delete your account, there is no going back after 30 days. Please be certain.
                </p>
                <button onClick={() => setModalOpen(true)} style={dangerBtnStyle}>
                    Delete Account
                </button>
            </section>

            {isModalOpen && (
                <Modal isOpen onClose={() => setModalOpen(false)}>
                    <div style={{ padding: 24, width: 400 }}>
                        <h2 style={{ color: "#cf1322", marginTop: 0 }}>Confirm Deletion</h2>
                        <p>Enter your password to confirm.</p>
                        {error && <p style={{ color: "red" }}>{error}</p>}

                        <input
                            type="password"
                            placeholder="Current Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(null);
                            }}
                            style={{ width: "100%", padding: 10, marginBottom: 16, boxSizing: "border-box" }}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button onClick={() => setModalOpen(false)} style={secondaryBtnStyle}>Cancel</button>
                            <button onClick={handleSubmit} style={dangerBtnStyle}>Confirm</button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

const dangerBtnStyle: React.CSSProperties = {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14
};

const secondaryBtnStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #d1d5db",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14
};