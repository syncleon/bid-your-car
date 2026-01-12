import { useState } from "react";
import { Modal } from "../../../shared/ui/Modal";
import { minStyles } from "./minimalStyles";

interface Props {
    onConfirmDelete: (password: string) => Promise<void>;
}

export const AccountDeleteSection = ({ onConfirmDelete }: Props) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!password) { setError("Password is required"); return; }
        try {
            await onConfirmDelete(password);
            setModalOpen(false);
        } catch (e: any) {
            setError(e.message || "Failed");
        }
    };

    return (
        <>
            <section style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#999", marginBottom: 12, textTransform: "uppercase" }}>Danger Zone</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "#666" }}>Delete account</span>
                    <button onClick={() => setModalOpen(true)} style={{ ...minStyles.textBtn, color: "#dc2626", fontSize: "13px" }}>
                        Delete
                    </button>
                </div>
            </section>

            {isModalOpen && (
                <Modal isOpen onClose={() => setModalOpen(false)}>
                    <div style={{ padding: 32, width: 400, background: "#fff", borderRadius: 8 }}>
                        <h2 style={{ marginTop: 0, fontSize: 20 }}>Confirm Deletion</h2>
                        <p style={{ color: "#666", marginBottom: 24 }}>Please enter your password to verify.</p>

                        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(null); }}
                            style={{ ...minStyles.input, borderBottom: '1px solid #ccc', marginBottom: 24 }}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button onClick={() => setModalOpen(false)} style={{...minStyles.primaryBtn, background: '#fff', color: '#000'}}>Cancel</button>
                            <button onClick={handleSubmit} style={{...minStyles.primaryBtn, background: '#dc2626'}}>Confirm</button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};