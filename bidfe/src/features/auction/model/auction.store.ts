import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllAuctions,
    getAuctionById,
    createAuction,
    placeBid,
    getEndingSoon,
    getMyWins,
    cancelAuction as apiCancelAuction,
    getAuctionBidHistory,
    approveAuction,
    rejectAuction
} from "../api/auction.api";
import type { AuctionDto, CreateAuctionDto, BidDto, PlaceBidReq } from "../types";

export class AuctionStore {
    auctions: AuctionDto[] = [];
    endingSoon: AuctionDto[] = [];
    myWins: AuctionDto[] = [];
    selectedAuction: AuctionDto | null = null;
    bidHistory: BidDto[] = [];

    // --- Pagination State ---
    currentPage = 0;
    totalPages = 0;
    isLoading = false;

    currentAuction: AuctionDto | null = null;
    isBidding = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Helper to safely extract error messages from unknown types
     */
    private getErrorMessage(error: unknown, defaultMessage: string): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        return defaultMessage;
    }

    /**
     * Loads auctions replacing the current list.
     * @param status Status (ACTIVE, SOLD)
     * @param page Page number
     * @param size Page size
     */
    loadAuctions = async (status: string | undefined, page: number, size: number) => {
        this.isLoading = true;
        this.error = null;

        try {
            const pageData = await getAllAuctions(status, page, size);

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

    loadMyWins = async () => {
        this.isLoading = true;
        this.error = null;
        try {
            const pageData = await getMyWins();
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

                // Update the item in the main list if it exists there
                const index = this.auctions.findIndex(a => a.id === req.auctionId);
                if (index !== -1) {
                    this.auctions[index] = updatedAuction;
                }
                this.isBidding = false;
            });
            return true;
        } catch (error: unknown) {
            runInAction(() => {
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

    rejectAuction = async (id: string) => {
        this.isLoading = true;
        this.error = null;

        try {
            await rejectAuction(id);
            runInAction(() => {
                if (this.selectedAuction && this.selectedAuction.id === id) {
                    this.selectedAuction.status = 'REJECTED';
                }
                this.auctions = this.auctions.filter(a => a.id !== id);
                this.isLoading = false;
            });
            return true;
        } catch (error: unknown) {
            runInAction(() => {
                this.error = this.getErrorMessage(error, "Failed to reject auction");
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

    clearSelectedAuction = () => {
        this.selectedAuction = null;
        this.bidHistory = [];
        this.error = null;
    };

    clearError = () => {
        this.error = null;
    };
}

export const auctionStore = new AuctionStore();