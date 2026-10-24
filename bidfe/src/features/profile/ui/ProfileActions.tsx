import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import type { IProfileStore } from "../model/profile.store";
import { Loader } from "../../../shared/ui/Loader/Loader";
import "./ProfileActions.css";

interface FormProps {
    store: IProfileStore;
    onCancel: () => void;
}

export const EditProfileForm = observer(({ store, onCancel }: FormProps) => {
    const [formData, setFormData] = useState({
        username: store.profile?.username || "",
        email: store.profile?.email || "",
        bio: store.profile?.bio || ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await store.updateProfileData(formData);
            onCancel();
        } catch {
            // Error state is managed by store.error
        }
    };

    return (
        <form onSubmit={handleSubmit} className="modern-form">
            <div className="modern-form-group">
                <label className="modern-label">Username</label>
                <input
                    className="modern-input"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                />
            </div>
            <div className="modern-form-group">
                <label className="modern-label">Email</label>
                <input
                    type="email"
                    className="modern-input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>
            <div className="modern-form-group">
                <label className="modern-label">Bio</label>
                <textarea
                    className="modern-input modern-textarea"
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={500}
                />
            </div>
            <div className="modern-form-actions">
                <button type="button" className="modern-btn modern-btn--secondary" onClick={onCancel} disabled={store.isLoading}>
                    Cancel
                </button>
                <button type="submit" className="modern-btn modern-btn--primary" disabled={store.isLoading}>
                    {store.isLoading ? <Loader size="small" /> : "Save Changes"}
                </button>
            </div>
        </form>
    );
});

export const ChangePasswordForm = observer(({ store, onCancel }: FormProps) => {
    const [formData, setFormData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (formData.newPassword !== formData.confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }
        if (formData.newPassword.length < 6) {
            setLocalError("Password must be at least 6 characters");
            return;
        }
        try {
            if (formData.oldPassword.trim()) {
                await store.changeUserPassword({
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword
                });
            } else {
                await store.setUserPassword(formData.newPassword);
            }
            onCancel();
        } catch {
            // Error managed by store
        }
    };

    return (
        <form onSubmit={handleSubmit} className="modern-form">
            {(localError || store.error) && (
                <div style={{ color: "#ef4444", fontSize: "14px", marginBottom: "12px", background: "rgba(239, 68, 68, 0.1)", padding: "8px 12px", borderRadius: "6px" }}>
                    {localError || store.error}
                </div>
            )}
            <div className="modern-form-group">
                <label className="modern-label">
                    Old Password <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>(leave blank if signed in with Google and setting a password for the first time)</span>
                </label>
                <input
                    type="password"
                    className="modern-input"
                    placeholder="Enter current password if set"
                    value={formData.oldPassword}
                    onChange={e => setFormData({ ...formData, oldPassword: e.target.value })}
                />
            </div>
            <div className="modern-form-group">
                <label className="modern-label">New Password</label>
                <input
                    type="password"
                    className="modern-input"
                    placeholder="At least 6 characters"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                    minLength={6}
                />
            </div>
            <div className="modern-form-group">
                <label className="modern-label">Confirm New Password</label>
                <input
                    type="password"
                    className="modern-input"
                    placeholder="Repeat new password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                />
            </div>
            <div className="modern-form-actions">
                <button type="button" className="modern-btn modern-btn--secondary" onClick={onCancel} disabled={store.isLoading}>
                    Cancel
                </button>
                <button type="submit" className="modern-btn modern-btn--primary" disabled={store.isLoading}>
                    {store.isLoading ? <Loader size="small" /> : "Save Password"}
                </button>
            </div>
        </form>
    );
});