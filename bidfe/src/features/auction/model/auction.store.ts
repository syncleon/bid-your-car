import { makeAutoObservable, runInAction } from "mobx";
import {
    getPublicAuctions,
    getAuctionById,
    createAuction,
    placeBid,
    placeQuickBid,
    getMyWins,
    getMyListings,
    cancelAuction as apiCancelAuction,
    adminCancelAuction as apiAdminCancelAuction,
    getAuctionBidHistory,
    approveAuction,
    getRecentlySold
} from "../api/auction.api";
import type {AuctionDto, CreateAuctionDto, BidDto, AuctionStatus} from "../types";
import type { RootStore } from "../../../app/stores/RootStore";

export class AuctionStore {
    auctions: AuctionDto[] = [];
    endingSoon: AuctionDto[] = [];
    soldAuctions: AuctionDto[] = [];
    myWins: AuctionDto[] = [];
    myListings: AuctionDto[] = [];
    selectedAuction: AuctionDto | null = null;
    bidHistory: BidDto[] = [];

    currentPage = 0;
    totalPages = 0;
    isLoading = false;

    currentAuction: AuctionDto | null = null;
    isBidding = false;
    error: string | null = null;

    private root: RootStore;

    constructor(root: RootStore) {
        this.root = root;
        makeAutoObservable(this);
    }

    get currentUser() {
        return this.root.authStore.user;
    }

    private getErrorMessage(error: any, defaultMessage: string): string {
        
        if (error?.response?.data) {
            if (error.response.data.message) return error.response.data.message;
            if (error.response.data.error) return error.response.data.error;
        }

        
        if (error instanceof Error) return error.message;

        
        if (typeof error === "string") return error;

        return defaultMessage;
    }

    loadAuctions = async (filter?: string, status?: AuctionStatus, page = 0, size = 20) => {
        this.isLoading = true;
        this.error = null;

        try {
            const pageData = await getPublicAuctions(status, filter, page, size);

            runInAction(() => {
                this.auctions = pageData.content;
                this.currentPage = pageData.number;
                this.totalPages = pageData.totalPages;
                this.isLoading = false;
            });
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to load auctions");
                this.isLoading = false;
            });
        }
    };

    loadRecentlySold = async (page = 0, size = 10) => {
        this.isLoading = true;
        try {
            const pageData = await getRecentlySold(page, size);
            runInAction(() => {
                this.soldAuctions = pageData.content;
                this.isLoading = false;
            });
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to load recently sold");
                this.isLoading = false;
            });
        }
    };

    loadAuctionDetails = async (id: string) => {
        this.isLoading = true;
        this.error = null;
        try {
            const [details, historyPage] = await Promise.all([
                getAuctionById(id),
                getAuctionBidHistory(id)
            ]);
            runInAction(() => {
                this.selectedAuction = details;
                this.bidHistory = historyPage.content;
                this.isLoading = false;
            });
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to load details");
                this.isLoading = false;
            });
        }
    };

    loadEndingSoon = async () => {
        try {
            const pageData = await getPublicAuctions("ACTIVE", "ending_soon", 0, 10);
            runInAction(() => {
                this.endingSoon = pageData.content;
            });
        } catch (error: unknown) {
            console.error("Failed to load ending soon auctions", error);
        }
    };

    loadMyWins = async (page = 0, size = 20) => {
        this.isLoading = true;
        this.error = null;
        try {
            const pageData = await getMyWins(page, size);
            runInAction(() => {
                this.myWins = pageData.content;
                this.isLoading = false;
            });
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to load won auctions");
                this.isLoading = false;
            });
        }
    };

    loadMyListings = async (page = 0, size = 20) => {
        this.isLoading = true;
        this.error = null;
        try {
            const pageData = await getMyListings(page, size);
            runInAction(() => {
                this.myListings = pageData.content;
                this.isLoading = false;
            });
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to load your listings");
                this.isLoading = false;
            });
        }
    };

    startAuction = async (data: CreateAuctionDto) => {
        this.isLoading = true;
        this.error = null;
        this.currentAuction = null;

        try {
            const newAuction = await createAuction(data);
            runInAction(() => {
                this.currentAuction = newAuction;
                this.isLoading = false;
            });
            return true;
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to start auction");
                this.isLoading = false;
            });
            return false;
        }
    };

    

    submitBid = async (auctionId: string, amount: number) => {
        this.isBidding = true;
        this.error = null;
        try {
            const newBid = await placeBid(auctionId, amount);
            await this.refreshAuctionStateLocally(auctionId, newBid);
            return true;
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to place bid");
                this.isBidding = false;
            });
            return false;
        }
    };

    submitQuickBid = async (auctionId: string) => {
        this.isBidding = true;
        
        try {
            const newBid = await placeQuickBid(auctionId);
            await this.refreshAuctionStateLocally(auctionId, newBid);
            return { success: true };
        } catch (error: unknown) {
            runInAction(() => { this.isBidding = false; });
            return { success: false, error: this.getErrorMessage(error, "Failed to place quick bid") };
        }
    };

    private refreshAuctionStateLocally = async (auctionId: string, newBid: BidDto) => {
        try {
            const updatedAuction = await getAuctionById(auctionId);
            runInAction(() => {
                this.bidHistory.unshift(newBid);
                this.selectedAuction = updatedAuction;

                const index = this.auctions.findIndex(a => a.id === auctionId);
                if (index !== -1) this.auctions[index] = updatedAuction;

                const soonIndex = this.endingSoon.findIndex(a => a.id === auctionId);
                if (soonIndex !== -1) this.endingSoon[soonIndex] = updatedAuction;

                this.isBidding = false;
            });
        } catch (error) {
            runInAction(() => { this.isBidding = false; });
        }
    }

    private replaceAuctionInCollections = (updated: AuctionDto) => {
        const replace = (list: AuctionDto[]) => {
            const index = list.findIndex(a => a.id === updated.id);
            if (index !== -1) list[index] = updated;
        };

        replace(this.auctions);
        replace(this.endingSoon);
        replace(this.soldAuctions);
        replace(this.myWins);
        replace(this.myListings);

        if (this.selectedAuction?.id === updated.id) {
            this.selectedAuction = updated;
        }
    };

    approveAuction = async (id: string) => {
        this.isLoading = true;
        this.error = null;

        try {
            await approveAuction(id);
            const freshAuction = await getAuctionById(id);

            runInAction(() => {
                this.replaceAuctionInCollections(freshAuction);
                this.isLoading = false;
            });

            return true;
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to approve auction");
                this.isLoading = false;
            });
            return false;
        }
    };

    cancelAuction = async (id: string) => {
        this.error = null;
        try {
            await apiCancelAuction(id);
            runInAction(() => {
                this.auctions = this.auctions.filter(a => a.id !== id);
                if (this.selectedAuction?.id === id) this.selectedAuction.status = 'CANCELLED';
            });
            return true;
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to cancel auction");
            });
            return false;
        }
    };

    adminCancelAuction = async (id: string) => {
        this.error = null;
        try {
            await apiAdminCancelAuction(id);
            runInAction(() => {
                this.auctions = this.auctions.filter(a => a.id !== id);
                if (this.selectedAuction?.id === id) this.selectedAuction.status = 'CANCELLED';
            });
            return true;
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to force cancel auction");
            });
            return false;
        }
    };

    clearSelectedAuction = () => {
        this.selectedAuction = null;
        this.bidHistory = [];
        this.error = null;
    };

    clearError = () => {
        this.error = null;
    };
}