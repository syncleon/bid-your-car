import { types, type Instance } from "mobx-state-tree";
import { AuthStore, type IAuthStore } from "../../features/auth/model/auth.store";
import { ProfileStore, type IProfileStore } from "../../features/profile/model/profile.store";
import { ItemStore, type IItemStore } from "../../features/item/model/item.store";
import { AuctionStore } from "../../features/auction/model/auction.store";
import { ToastStore, type IToastStore } from "../../shared/model/toast.store";
import { AdminStore, type IAdminStore } from "../../features/admin/model/admin.store";

const MstRootModel = types.model("MstRoot", {
    authStore: AuthStore,
    profileStore: ProfileStore,
    itemStore: ItemStore,
    toastStore: ToastStore,
    adminStore: AdminStore,
});

export class RootStore {
    private mstRoot: Instance<typeof MstRootModel>;
    auctionStore: AuctionStore;

    constructor() {
        this.mstRoot = MstRootModel.create({
            authStore: {},
            profileStore: {},
            itemStore: {},
            toastStore: {},
            adminStore: {}
        });
        this.auctionStore = new AuctionStore(this);
    }
    get authStore(): IAuthStore {
        return this.mstRoot.authStore;
    }

    get profileStore(): IProfileStore {
        return this.mstRoot.profileStore;
    }

    get itemStore(): IItemStore {
        return this.mstRoot.itemStore;
    }

    get toastStore(): IToastStore {
        return this.mstRoot.toastStore;
    }

    get adminStore(): IAdminStore {
        return this.mstRoot.adminStore;
    }
}

export const rootStore = new RootStore();