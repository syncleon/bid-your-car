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

    // Tracks the newly created auction for navigation
    currentAuction: AuctionDto | null = null;

    isLoading = false;
    isBidding = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    loadAuctions = async (status?: string) => {
        this.isLoading = true;
        this.error = null;
        try {
            const pageData = await getAllAuctions(status);
            let content = pageData.content;

            // --- SORTING UPDATE ---
            // If viewing Active auctions, sort by End Time (Ascending)
            // so auctions ending soonest appear first.
            if (!status || status === 'ACTIVE') {
                content = content.sort((a, b) =>
                    new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
                );
            }

            runInAction(() => {
                this.auctions = content;
                this.isLoading = false;
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load auctions";
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
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load details";
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
        } catch (err: any) {
            console.error("Failed to load ending soon auctions", err);
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
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load won auctions";
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
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to start auction";
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
            // Fetch updated details to get new price/bid count immediately
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
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to place bid";
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
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to approve auction";
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
                // Remove rejected items from the main feed immediately
                this.auctions = this.auctions.filter(a => a.id !== id);
                this.isLoading = false;
            });
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to reject auction";
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
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to cancel auction";
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