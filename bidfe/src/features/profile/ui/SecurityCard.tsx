import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";
import { minStyles } from "./minimalStyles";observer(() => {
    const { profileStore } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwords.oldPassword || !passwords.newPassword) {
            return; // Store handles validation, but we can prevent empty submits
        }

        try {
            await profileStore.changeUserPassword(passwords);
            // On success: Clear form, close edit mode
            setPasswords({ oldPassword: "", newPassword: "" });
            setIsEditing(false);
        } catch (e) {
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setPasswords({ oldPassword: "", newPassword: "" });
        if (profileStore.clearMessages) {
            profileStore.clearMessages();
        }
    };

    return (
        <section style={minStyles.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: isEditing ? 20 : 16 }}>
                <h3 style={minStyles.header}>Security</h3>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        style={minStyles.textBtn}
                    >
                        Change Password
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} style={{ maxWidth: "100%" }}>

                    {profileStore.error && (
                        <div style={{
                            padding: "12px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: "13px",
                            borderRadius: "4px",
                            marginBottom: "16px",
                            border: "1px solid #fee2e2"
                        }}>
                            {profileStore.error}
                        </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <label style={minStyles.label}>Current Password</label>
                        <input
                            type="password"
                            style={minStyles.input}
                            placeholder="Enter current password"
                            value={passwords.oldPassword}
                            onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={minStyles.label}>New Password</label>
                        <input
                            type="password"
                            style={minStyles.input}
                            placeholder="Enter new password"
                            value={passwords.newPassword}
                            onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                        />
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            type="submit"
                            style={{...minStyles.primaryBtn, background: '#000', color: '#fff'}}
                            disabled={profileStore.isLoading}
                        >
                            {profileStore.isLoading ? "Updating..." : "Update Password"}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            style={minStyles.textBtn}
                            disabled={profileStore.isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div>
                    <span style={minStyles.label}>Password</span>
                    <div style={{ fontSize: "14px", color: "#666", letterSpacing: "2px" }}>
                        ••••••••••••
                    </div>
                </div>
            )}
        </section>
    );
});
