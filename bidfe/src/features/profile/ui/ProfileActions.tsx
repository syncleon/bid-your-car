import React, { useState } from "react";
import type {ProfileStore} from "../model/profile.store.ts";

// --- Edit Profile Form ---
export const EditProfileForm = ({ store, onCancel }: { store: ProfileStore; onCancel: () => void }) => {
    const [formData, setFormData] = useState({
        username: store.profile?.username || "",
        email: store.profile?.email || ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await store.updateProfileData(formData);
            onCancel();
        } catch (e) { /* Error is in store.error */ }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form">
            <div style={{ marginBottom: 15 }}>
                <label style={{ display:'block', marginBottom: 5 }}>Username</label>
                <input
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    style={{ padding: 8, width: '100%' }}
                />
            </div>
            <div style={{ marginBottom: 15 }}>
                <label style={{ display:'block', marginBottom: 5 }}>Email</label>
                <input
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{ padding: 8, width: '100%' }}
                />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={store.isLoading}>Save</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
};

// --- Password Form ---
export const ChangePasswordForm = ({ store, onCancel }: { store: ProfileStore; onCancel: () => void }) => {
    const [formData, setFormData] = useState({ oldPassword: "", newPassword: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await store.changeUserPassword(formData);
            onCancel();
        } catch (e) { /* Error in store */ }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form">
            <div style={{ marginBottom: 15 }}>
                <input
                    type="password" placeholder="Old Password"
                    value={formData.oldPassword}
                    onChange={e => setFormData({...formData, oldPassword: e.target.value})}
                    style={{ padding: 8, width: '100%', marginBottom: 10 }}
                />
                <input
                    type="password" placeholder="New Password"
                    value={formData.newPassword}
                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                    style={{ padding: 8, width: '100%' }}
                />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={store.isLoading}>Update Password</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
};