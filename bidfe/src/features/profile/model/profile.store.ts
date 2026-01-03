import { makeAutoObservable, runInAction } from "mobx";
import {
    getProfile,
    deleteUserById,
    updateProfile,
    changePassword,
} from "../api/profile.api";
import type { Profile } from "../types";
import { AuthStore } from "../../auth/model/auth.store";

/**
 * Manages the user's personal profile state and associated administrative actions.
 * Handles profile retrieval, data updates, security settings, and account lifecycle.
 */
export class ProfileStore {
    profile: Profile | null = null;
    isLoading = false;
    error: string | null = null;
    successMessage: string | null = null;
    isCheckingAvailability = false;
    availabilityError: string | null = null;

    private authStore: AuthStore;

    constructor(authStore: AuthStore) {
        this.authStore = authStore;
        makeAutoObservable(this);
    }

    /**
     * Fetches the current authenticated user's profile details from the server.
     */
    async loadProfile() {
        this.isLoading = true;
        try {
            const data = await getProfile();
            runInAction(() => {
                this.profile = data;
            });
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    /**
     * Updates the user's general information.
     * * @param data Object containing the new username and email address.
     * @throws Re-throws the error for component-level form handling.
     */
    async updateProfileData(data: { username: string; email: string }) {
        this.isLoading = true;
        this.clearMessages();
        try {
            const updated = await updateProfile(data);
            runInAction(() => {
                this.profile = updated;
                this.successMessage = "Profile updated successfully!";
            });
        } catch (e) {
            runInAction(() => {
                this.error = (e as Error).message;
            });
            throw e;
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    /**
     * Updates the user's password.
     * * @param data Object containing the old password for verification and the new password.
     * @throws Re-throws the error for component-level form handling.
     */
    async changeUserPassword(data: { oldPassword: string; newPassword: string }) {
        this.isLoading = true;
        this.clearMessages();
        try {
            await changePassword(data);
            runInAction(() => {
                this.successMessage = "Password changed successfully!";
            });
        } catch (e) {
            runInAction(() => {
                this.error = (e as Error).message;
            });
            throw e;
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    /**
     * Initiates a soft-delete of the user's account.
     * Requires the user's current password for verification. Upon success,
     * it destroys the local session via AuthStore.
     * * @param password The current user password to authorize deletion.
     * @throws Re-throws the error to display validation messages in the UI.
     */
    async deleteAccount(password: string) {
        if (!this.profile?.id) return;

        this.isLoading = true;
        try {
            await deleteUserById(this.profile.id, password);

            runInAction(() => {
                this.profile = null;
            });

            this.authStore.logout();
        } catch (e) {
            runInAction(() => {
                this.error = (e as Error).message;
            });
            throw e;
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    /**
     * Resets all transient UI states, including error and success feedback.
     */
    clearMessages() {
        this.error = null;
        this.successMessage = null;
        this.availabilityError = null;
    }
}