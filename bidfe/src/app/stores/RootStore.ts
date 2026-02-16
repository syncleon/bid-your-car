import { types, type Instance } from "mobx-state-tree";
import { AuthStore, type IAuthStore } from "../../features/auth/model/auth.store";
import { ProfileStore, type IProfileStore } from "../../features/profile/model/profile.store";
import { ItemStore, type IItemStore } from "../../features/item/model/item.store";
import { AuctionStore } from "../../features/auction/model/auction.store";

/**
 * Internal MST Root to allow getRoot() to work across MST stores.
 */
const MstRootModel = types.model("MstRoot", {
    authStore: AuthStore,
    profileStore: ProfileStore,
    itemStore: ItemStore,
});

export class RootStore {
    // Stores
    private mstRoot: Instance<typeof MstRootModel>;
    auctionStore: AuctionStore;

    constructor() {
        // 1. Create the combined MST tree
        // This triggers afterCreate in AuthStore to load tokens
        this.mstRoot = MstRootModel.create({
            authStore: {},
            profileStore: {},
            itemStore: {}
        });

        // 2. Initialize Class-based stores, passing 'this' for cross-store access
        this.auctionStore = new AuctionStore(this);
    }

    // Getters for easy access: rootStore.authStore
    get authStore(): IAuthStore {
        return this.mstRoot.authStore;
    }

    get profileStore(): IProfileStore {
        return this.mstRoot.profileStore;
    }

    get itemStore(): IItemStore {
        return this.mstRoot.itemStore;
    }
}

export const rootStore = new RootStore();