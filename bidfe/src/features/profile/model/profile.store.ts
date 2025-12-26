import { makeAutoObservable } from "mobx";
import { getProfile } from "../api/profile.api";
import type { Profile } from "../types";

export class ProfileStore {
    profile: Profile | null = null;
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    async loadProfile() {
        this.isLoading = true;
        try {
            this.profile = await getProfile();
        } finally {
            this.isLoading = false;
        }
    }

    clear() {
        this.profile = null;
    }
}