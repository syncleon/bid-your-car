import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";
import type { Profile } from "../types";
import { minStyles } from "./minimalStyles";

export const ProfileInfoSection = observer(({ profile }: { profile: Profile }) => {
    const { profileStore } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: profile.username, email: profile.email });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await profileStore.updateProfileData(formData);
        setIsEditing(false);
    };

    return (
        <section style={minStyles.section}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={minStyles.header}>Personal Information</h3>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} style={minStyles.textBtn}>Edit</button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={minStyles.label}>Username</label>
                        <input
                            style={minStyles.input}
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div style={{ marginBottom: 30 }}>
                        <label style={minStyles.label}>Email</label>
                        <input
                            style={minStyles.input}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                        <button type="submit" style={minStyles.primaryBtn} disabled={profileStore.isLoading}>Save</button>
                        <button type="button" onClick={() => setIsEditing(false)} style={minStyles.textBtn}>Cancel</button>
                    </div>
                </form>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, color: "#444" }}>
                    <div>
                        <span style={minStyles.label}>Username</span>
                        <div>{profile.username}</div>
                    </div>
                    <div>
                        <span style={minStyles.label}>Email</span>
                        <div>{profile.email}</div>
                    </div>
                </div>
            )}
        </section>
    );
});