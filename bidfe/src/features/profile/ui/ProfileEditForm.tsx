import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";

interface Props {
    onCancel: () => void;
}

/**
 * Component providing an interface to modify user account details.
 * Synchronizes local form state with the ProfileStore and handles
 * the transition between view and edit modes.
 */
export const ProfileEditForm = observer(({ onCancel }: Props) => {
    const { profileStore } = useStore();
    const [formData, setFormData] = useState({
        username: profileStore.profile?.username || "",
        email: profileStore.profile?.email || "",
    });

    /**
     * Persists the modified profile data to the server.
     * Prevents default form submission, updates the global store,
     * and triggers the parent's cancellation callback upon success.
     * * @param e The React form event.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await profileStore.updateProfileData(formData);
            onCancel();
        } catch {
            /* Error state managed by profileStore */
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label>
                Username:
                <input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                />
            </label>
            <label>
                Email:
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button type="submit" disabled={profileStore.isLoading}>
                    {profileStore.isLoading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={onCancel} disabled={profileStore.isLoading}>
                    Cancel
                </button>
            </div>
        </form>
    );
});