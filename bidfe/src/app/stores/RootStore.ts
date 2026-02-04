import { AuthStore } from "../../features/auth/model/auth.store";
import { ProfileStore } from "../../features/profile/model/profile.store";
import { AuctionStore } from "../../features/auction/model/auction.store";
import {ItemStore} from "../../features/item/model/item.store.ts";

export class RootStore {
    authStore: AuthStore;
    profileStore: ProfileStore;
    itemStore: ItemStore;
    auctionStore: AuctionStore;

    constructor() {
        this.authStore = new AuthStore();
        this.profileStore = new ProfileStore(this.authStore);
        this.itemStore = new ItemStore();
        this.auctionStore = new AuctionStore();
    }
}