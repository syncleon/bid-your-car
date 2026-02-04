import { makeAutoObservable, runInAction } from "mobx";
import {
    getProfile,
    deleteUserById,
    updateProfile,
    changePassword,
} from "../api/profile.api";
import type { Profile } from "../types";
import type {AuthStore} from "../../auth/model/auth.store.ts";

export class ProfileStore {
    profile: Profile | null = null;
    isLoading = false;
    error: string | null = null;
    successMessage: string | null = null;

    private authStore: AuthStore;

    constructor(authStore: AuthStore) {
        this.authStore = authStore;
        makeAutoObservable(this);
    }

    async loadProfile() {
        this.isLoading = true;
        try {
            const data = await getProfile();
            runInAction(() => {
                this.profile = data;
            });
        } catch (e) {
            // Silently fail if just loading profile (maybe token expired)
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async updateProfileData(data: { username: string; email: string }) {
        this.isLoading = true;
        this.clearMessages();
        try {
            const updated = await updateProfile(data);
            runInAction(() => {
                this.profile = updated;
                this.successMessage = "Profile updated successfully!";
            });
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message;
            });
            throw e;
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async changeUserPassword(data: { oldPassword: string; newPassword: string }) {
        this.isLoading = true;
        this.clearMessages();
        try {
            await changePassword(data);
            runInAction(() => {
                this.successMessage = "Password changed successfully!";
            });
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message;
            });
            throw e;
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async deleteAccount(password: string) {
        if (!this.profile?.id) return;

        this.isLoading = true;
        try {
            await deleteUserById(this.profile.id, password);

            runInAction(() => {
                this.profile = null;
            });

            // IMPORTANT: Clear client-side session
            this.authStore.logout();
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message;
            });
            throw e;
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    clearMessages() {
        this.error = null;
        this.successMessage = null;
    }
}