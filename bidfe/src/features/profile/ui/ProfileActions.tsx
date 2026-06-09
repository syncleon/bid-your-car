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
    const [formData, setFormData] = useState({ oldPassword: "", newPassword: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await store.changeUserPassword(formData);
            onCancel();
        } catch {
            // Error managed by store
        }
    };

    return (
        <form onSubmit={handleSubmit} className="modern-form">
            <div className="modern-form-group">
                <label className="modern-label">Old Password</label>
                <input
                    type="password"
                    className="modern-input"
                    value={formData.oldPassword}
                    onChange={e => setFormData({ ...formData, oldPassword: e.target.value })}
                    required
                />
            </div>
            <div className="modern-form-group">
                <label className="modern-label">New Password</label>
                <input
                    type="password"
                    className="modern-input"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                    minLength={6}
                />
            </div>
            <div className="modern-form-actions">
                <button type="button" className="modern-btn modern-btn--secondary" onClick={onCancel} disabled={store.isLoading}>
                    Cancel
                </button>
                <button type="submit" className="modern-btn modern-btn--primary" disabled={store.isLoading}>
                    {store.isLoading ? <Loader size="small" /> : "Update Password"}
                </button>
            </div>
        </form>
    );
});