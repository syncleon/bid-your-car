import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import type { IProfileStore } from "../model/profile.store";

interface FormProps {
    store: IProfileStore;
    onCancel: () => void;
}

export const EditProfileForm = observer(({ store, onCancel }: FormProps) => {
    const [formData, setFormData] = useState({
        username: store.profile?.username || "",
        email: store.profile?.email || ""
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
        <form onSubmit={handleSubmit} className="profile-form">
            <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Username</label>
                <input
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    style={{ padding: 8, width: '100%' }}
                    required
                />
            </div>
            <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>Email</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ padding: 8, width: '100%' }}
                    required
                />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={store.isLoading}>
                    {store.isLoading ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={onCancel} disabled={store.isLoading}>
                    Cancel
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
        <form onSubmit={handleSubmit} className="profile-form">
            <div style={{ marginBottom: 15 }}>
                <input
                    type="password"
                    placeholder="Old Password"
                    value={formData.oldPassword}
                    onChange={e => setFormData({ ...formData, oldPassword: e.target.value })}
                    style={{ padding: 8, width: '100%', marginBottom: 10 }}
                    required
                />
                <input
                    type="password"
                    placeholder="New Password"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    style={{ padding: 8, width: '100%' }}
                    required
                    minLength={6}
                />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={store.isLoading}>
                    {store.isLoading ? "Updating..." : "Update Password"}
                </button>
                <button type="button" onClick={onCancel} disabled={store.isLoading}>
                    Cancel
                </button>
            </div>
        </form>
    );
});