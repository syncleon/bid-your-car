import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Modal } from "../../../shared/ui/Modal";
import { useStore } from "../../../shared/hooks/useStore";
import { minStyles } from "./minimalStyles";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onDeleteAccount: (password: string) => Promise<void>;
}

export const ProfileSettingsModal = observer(({ isOpen, onClose, onDeleteAccount }: Props) => {
    const { profileStore } = useStore();
    const [activeTab, setActiveTab] = useState<"general" | "security">("general");

    // Form States
    const [infoForm, setInfoForm] = useState({ username: "", email: "" });
    const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "" });
    const [deletePass, setDeletePass] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen && profileStore.profile) {
            setInfoForm({
                username: profileStore.profile.username,
                email: profileStore.profile.email
            });
            // Reset other states
            setPassForm({ oldPassword: "", newPassword: "" });
            setDeletePass("");
            setShowDeleteConfirm(false);
            profileStore.clearMessages();
        }
    }, [isOpen, profileStore.profile]);

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await profileStore.updateProfileData(infoForm);
    };

    const handlePassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await profileStore.changeUserPassword(passForm);
        setPassForm({ oldPassword: "", newPassword: "" });
    };

    const handleDeleteSubmit = async () => {
        if(!deletePass) return;
        try {
            await onDeleteAccount(deletePass);
            onClose();
        } catch (e) {
            // Handled by store/parent
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div style={{ background: "#fff", width: 450, borderRadius: 8, padding: 32, maxHeight: "90vh", overflowY: "auto" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, margin: 0 }}>Settings</h2>
                    <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>&times;</button>
                </div>

                {/* Tabs */}
                <div style={{ marginBottom: 32, borderBottom: "1px solid #eee" }}>
                    <button
                        onClick={() => setActiveTab("general")}
                        style={{ ...minStyles.tabBtn, ...(activeTab === "general" ? minStyles.activeTab : {}) }}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        style={{ ...minStyles.tabBtn, ...(activeTab === "security" ? minStyles.activeTab : {}) }}
                    >
                        Security
                    </button>
                </div>

                {/* Error/Success Messages */}
                {profileStore.error && <div style={{ color: "#dc2626", marginBottom: 16, fontSize: 13 }}>{profileStore.error}</div>}

                {/* TAB 1: General (Edit Profile) */}
                {activeTab === "general" && (
                    <form onSubmit={handleInfoSubmit}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={minStyles.label}>Username</label>
                            <input
                                style={minStyles.input}
                                value={infoForm.username}
                                onChange={e => setInfoForm({ ...infoForm, username: e.target.value })}
                            />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={minStyles.label}>Email</label>
                            <input
                                style={minStyles.input}
                                value={infoForm.email}
                                onChange={e => setInfoForm({ ...infoForm, email: e.target.value })}
                            />
                        </div>
                        <button type="submit" disabled={profileStore.isLoading} style={minStyles.primaryBtn}>
                            {profileStore.isLoading ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                )}

                {/* TAB 2: Security (Password + Delete) */}
                {activeTab === "security" && (
                    <>
                        <form onSubmit={handlePassSubmit} style={{ marginBottom: 40 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Change Password</h4>
                            <input
                                type="password"
                                placeholder="Current Password"
                                style={minStyles.input}
                                value={passForm.oldPassword}
                                onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                style={minStyles.input}
                                value={passForm.newPassword}
                                onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                            />
                            <button type="submit" disabled={profileStore.isLoading} style={minStyles.primaryBtn}>
                                Update Password
                            </button>
                        </form>

                        <div style={{ paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
                            <h4 style={{ fontSize: 12, color: "#dc2626", textTransform: "uppercase", marginBottom: 12 }}>Danger Zone</h4>

                            {!showDeleteConfirm ? (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 13, color: "#666" }}>Permanently delete account</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        style={{ ...minStyles.textBtn, color: "#dc2626" }}
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            ) : (
                                <div style={{ background: "#fff1f2", padding: 16, borderRadius: 4 }}>
                                    <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#9f1239" }}>
                                        Enter your password to confirm deletion. This cannot be undone.
                                    </p>
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        style={{ ...minStyles.input, background: "#fff", marginBottom: 12 }}
                                        value={deletePass}
                                        onChange={e => setDeletePass(e.target.value)}
                                    />
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <button
                                            onClick={handleDeleteSubmit}
                                            disabled={!deletePass || profileStore.isLoading}
                                            style={{ ...minStyles.primaryBtn, background: "#dc2626" }}
                                        >
                                            Confirm Delete
                                        </button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(false); setDeletePass(""); }}
                                            style={minStyles.textBtn}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
});