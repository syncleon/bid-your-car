import { types, flow, type Instance } from "mobx-state-tree";
import { adminApi } from "../api/admin.api";


const AdminUserModel = types.model("AdminUser", {
    id: types.number,
    username: types.string,
    email: types.string,
    enabled: types.boolean,
    profilePhotoUrl: types.maybeNull(types.string),
});

const AdminAuctionItemModel = types.model("AdminAuctionItem", {
    year: types.number,
    make: types.string,
    model: types.string,
});

const AdminAuctionModel = types.model("AdminAuction", {
    id: types.string,
    status: types.string,
    startTime: types.maybeNull(types.string),
    endTime: types.maybeNull(types.string),
    item: AdminAuctionItemModel,
});

export const AdminStore = types.model("AdminStore", {
    users: types.array(AdminUserModel),
    auctions: types.array(AdminAuctionModel),
    isLoadingUsers: false,
    isLoadingAuctions: false,
    error: types.maybeNull(types.string),
    totalPagesUsers: 0,
    currentPageUsers: 0,
    totalPagesAuctions: 0,
    currentPageAuctions: 0,
}).views((self) => ({
    get sortedAuctions() {
        return self.auctions.slice().sort((a, b) => {
            if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1;
            if (a.status !== 'PENDING_APPROVAL' && b.status === 'PENDING_APPROVAL') return 1;
            return 0;
        });
    }
})).actions((self) => {
    const fetchUsers = flow(function* (page = 0, query = "") {
        self.isLoadingUsers = true;
        self.error = null;
        try {
            const response = query 
                ? yield adminApi.searchUsers(query, page)
                : yield adminApi.getUsers(page);
            self.users.replace(response.content);
            self.totalPagesUsers = response.totalPages || 0;
            self.currentPageUsers = response.number || 0;
        } catch (error: unknown) {
            self.error = error instanceof Error ? error.message : "An error occurred";
        } finally {
            self.isLoadingUsers = false;
        }
    });

    const deactivateUser = flow(function* (userId: number) {
        try {
            yield adminApi.deactivateUser(userId);
            yield fetchUsers(self.currentPageUsers); 
        } catch (error: unknown) {
            self.error = error instanceof Error ? error.message : "An error occurred";
        }
    });

    const fetchAuctions = flow(function* (status?: string, page = 0) {
        self.isLoadingAuctions = true;
        self.error = null;
        try {
            const response = yield adminApi.getAuctions(status, page);
            self.auctions.replace(response.content);
            self.totalPagesAuctions = response.totalPages || 0;
            self.currentPageAuctions = response.number || 0;
        } catch (error: unknown) {
            self.error = error instanceof Error ? error.message : "An error occurred";
        } finally {
            self.isLoadingAuctions = false;
        }
    });

    const approveAuction = flow(function* (auctionId: string, status?: string) {
        try {
            yield adminApi.approveAuction(auctionId);
            yield fetchAuctions(status, self.currentPageAuctions);
        } catch (error: unknown) {
            self.error = error instanceof Error ? error.message : "An error occurred";
        }
    });

    const forceCancelAuction = flow(function* (auctionId: string, status?: string) {
        try {
            yield adminApi.forceCancelAuction(auctionId);
            yield fetchAuctions(status, self.currentPageAuctions);
        } catch (error: unknown) {
            self.error = error instanceof Error ? error.message : "An error occurred";
        }
    });

    return {
        fetchUsers,
        deactivateUser,
        fetchAuctions,
        approveAuction,
        forceCancelAuction
    };
});

export type IAdminStore = Instance<typeof AdminStore>;
