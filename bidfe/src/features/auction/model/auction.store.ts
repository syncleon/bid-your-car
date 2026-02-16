import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllAuctions,
    getAuctionById,
    createAuction,
    placeBid,
    getEndingSoon,
    getMyWins,
    getMyListings, // <-- NEW
    cancelAuction as apiCancelAuction,
    adminCancelAuction as apiAdminCancelAuction, // <-- NEW
    getAuctionBidHistory,
    approveAuction, getRecentlySold
    // rejectAuction removed!
} from "../api/auction.api";
import type { AuctionDto, CreateAuctionDto, BidDto, PlaceBidReq } from "../types";
import type {RootStore} from "../../../app/stores/RootStore.ts";

export class AuctionStore {
    auctions: AuctionDto[] = [];
    endingSoon: AuctionDto[] = [];
    soldAuctions: AuctionDto[] = [];
    myWins: AuctionDto[] = [];
    myListings: AuctionDto[] = [];
    selectedAuction: AuctionDto | null = null;
    bidHistory: BidDto[] = [];

    // PAGINATION
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

    private getErrorMessage(error: unknown, defaultMessage: string): string {
        if (error instanceof Error) return error.message;
        if (typeof error === "string") return error;
        return defaultMessage;
    }

    loadAuctions = async (filter?: string, status?: string, page = 0, size = 20) => {
        this.isLoading = true;
        this.error = null;

        try {
            const pageData = await getAllAuctions(filter, status, page, size);

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
            const pageData = await getEndingSoon();
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

    // --- NEW: Load My Listings ---
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

    submitBid = async (req: PlaceBidReq) => {
        this.isBidding = true;
        this.error = null;
        try {
            const newBid = await placeBid(req);
            const updatedAuction = await getAuctionById(req.auctionId);

            runInAction(() => {
                this.bidHistory.unshift(newBid);
                this.selectedAuction = updatedAuction;

                // Sync the main list if it's currently showing active auctions
                const index = this.auctions.findIndex(a => a.id === req.auctionId);
                if (index !== -1) {
                    this.auctions[index] = updatedAuction;
                }

                // If it was in "Ending Soon", update it there too
                const soonIndex = this.endingSoon.findIndex(a => a.id === req.auctionId);
                if (soonIndex !== -1) {
                    this.endingSoon[soonIndex] = updatedAuction;
                }

                this.isBidding = false;
            });
            return true;
        } catch (error: unknown) {
            runInAction(() => {
                // The Rate Limiter error from the backend will be caught here
                this.error = this.getErrorMessage(error, "Failed to place bid");
                this.isBidding = false;
            });
            return false;
        }
    };

    // --- Approval Workflow Actions ---

    approveAuction = async (id: string) => {
        this.isLoading = true;
        this.error = null;

        try {
            await approveAuction(id);
            runInAction(() => {
                if (this.selectedAuction && this.selectedAuction.id === id) {
                    this.selectedAuction.status = 'ACTIVE';
                }
                const index = this.auctions.findIndex(a => a.id === id);
                if (index !== -1) {
                    this.auctions[index].status = 'ACTIVE';
                }
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
                if (this.selectedAuction?.id === id) {
                    this.selectedAuction.status = 'CANCELLED';
                }
            });
            return true;
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to cancel auction");
            });
            return false;
        }
    };

    // --- NEW: Admin Cancel ---
    adminCancelAuction = async (id: string) => {
        this.error = null;
        try {
            await apiAdminCancelAuction(id);
            runInAction(() => {
                this.auctions = this.auctions.filter(a => a.id !== id);
                if (this.selectedAuction?.id === id) {
                    this.selectedAuction.status = 'CANCELLED';
                }
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