import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore";
import { Modal } from "../shared/ui/Modal";
import { useNavigate } from "react-router-dom";
import { ProfileEditForm } from "../features/profile/ui/ProfileEditForm";
import { ChangePasswordForm } from "../features/profile/ui/ChangePasswordForm";

/**
 * Page component representing the user's private profile dashboard.
 * Provides functionality for viewing/editing personal data, managing security settings,
 * and initiating the account deletion process with a 30-day recovery warning.
 */
export const ProfilePage = observer(() => {
    const { profileStore } = useStore();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState<string | null>(null);

    /**
     * Orchestrates the initial data fetch on mount and performs
     * cleanup of transient store messages on unmount.
     */
    useEffect(() => {
        profileStore.loadProfile();
        return () => profileStore.clearMessages();
    }, [profileStore]);

    /**
     * Validates credentials and executes the account deletion flow.
     * Transitions the user to the login screen upon successful soft-deletion.
     */
    const handleDeleteSubmit = async () => {
        if (!deletePassword) return setDeleteError("Password required");

        try {
            await profileStore.deleteAccount(deletePassword);
            setDeleteModalOpen(false);
            navigate("/login");
        } catch (e) {
            setDeleteError((e as Error).message);
        }
    };

    if (profileStore.isLoading && !profileStore.profile) return <p>Loading...</p>;
    if (!profileStore.profile) return <p>No profile found.</p>;

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
            <h1>My Profile</h1>

            {profileStore.successMessage && (
                <div style={{ color: "green", background: "#e6fffa", padding: 10, marginBottom: 20 }}>
                    {profileStore.successMessage}
                </div>
            )}
            {profileStore.error && (
                <div style={{ color: "red", background: "#fff5f5", padding: 10, marginBottom: 20 }}>
                    {profileStore.error}
                </div>
            )}

            <section style={{ marginBottom: 30, border: "1px solid #eee", padding: 20, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                    <h2 style={{ margin: 0 }}>General Information</h2>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)}>Edit Profile</button>
                    )}
                </div>

                {isEditing ? (
                    <ProfileEditForm onCancel={() => setIsEditing(false)} />
                ) : (
                    <div>
                        <p><strong>Username:</strong> {profileStore.profile.username}</p>
                        <p><strong>Email:</strong> {profileStore.profile.email}</p>
                    </div>
                )}
            </section>

            <section style={{ marginBottom: 30, border: "1px solid #eee", padding: 20, borderRadius: 8 }}>
                <h2>Security</h2>
                <p>Change your password</p>
                <ChangePasswordForm />
            </section>

            <section style={{ border: "1px solid #ffccc7", padding: 20, borderRadius: 8, background: "#fff1f0" }}>
                <h2 style={{ color: "#cf1322", marginTop: 0 }}>Danger Zone</h2>
                <p>
                    <strong>Warning:</strong> Deleting your account will log you out immediately.
                    Your data will be kept for <strong>30 days</strong> in case you change your mind.
                    After that, it will be permanently removed.
                </p>
                <p>
                    To restore your account within 30 days, simply try to log in and click "Restore".
                </p>
                <button
                    onClick={() => setDeleteModalOpen(true)}
                    style={{ background: "#cf1322", color: "white", border: "none", padding: "8px 16px", cursor: "pointer" }}
                >
                    Delete Account
                </button>
            </section>

            {isDeleteModalOpen && (
                <Modal isOpen onClose={() => setDeleteModalOpen(false)}>
                    <div style={{ padding: 20 }}>
                        <h2 style={{ color: "#cf1322" }}>Confirm Deletion</h2>
                        <p>Enter your password to confirm. This cannot be undone immediately.</p>

                        {deleteError && <p style={{ color: "red" }}>{deleteError}</p>}

                        <input
                            type="password"
                            placeholder="Current Password"
                            value={deletePassword}
                            onChange={(e) => {
                                setDeletePassword(e.target.value);
                                setDeleteError(null);
                            }}
                            style={{ width: "100%", padding: 8, marginBottom: 15 }}
                        />

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setDeleteModalOpen(false)}>Cancel</button>
                            <button
                                onClick={handleDeleteSubmit}
                                style={{ background: "#cf1322", color: "white" }}
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
});