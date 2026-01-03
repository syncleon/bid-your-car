import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../shared/hooks/useStore";

/**
 * Component providing a form for users to update their account password.
 * Interfaces with the ProfileStore to validate the current password
 * before applying the new one.
 */
export const ChangePasswordForm = observer(() => {
    const { profileStore } = useStore();
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });

    /**
     * Handles the form submission for password changes.
     * Prevents default browser behavior, executes the store action,
     * and resets the local state upon successful completion.
     * * @param e The React form event.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await profileStore.changeUserPassword(passwords);
            setPasswords({ oldPassword: "", newPassword: "" });
        } catch {
            /* Error state is captured and managed by profileStore */
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
                type="password"
                placeholder="Current Password"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                required
            />
            <input
                type="password"
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
            />
            <button type="submit" disabled={profileStore.isLoading}>
                Update Password
            </button>
        </form>
    );
});