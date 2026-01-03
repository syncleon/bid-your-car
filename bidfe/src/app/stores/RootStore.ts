import { AuthStore } from "../../features/auth/model/auth.store";
import { ProfileStore } from "../../features/profile/model/profile.store";

export class RootStore {
    authStore: AuthStore;
    profileStore: ProfileStore;

    constructor() {
        this.authStore = new AuthStore();
        this.profileStore = new ProfileStore(this.authStore);
    }
}