import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllAuctions,
    getAuctionById,
    createAuction,
    placeBid,
    getEndingSoon,
    getMyWins,
    cancelAuction as apiCancelAuction, // Aliased to avoid name collision
    getAuctionBidHistory
} from "../api/auction.api";
import type { AuctionDto, CreateAuctionDto, BidResp, PlaceBidReq } from "../types";

export class AuctionStore {
    auctions: AuctionDto[] = [];
    endingSoon: AuctionDto[] = [];
    myWins: AuctionDto[] = [];
    selectedAuction: AuctionDto | null = null;
    bidHistory: BidResp[] = [];

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
            runInAction(() => {
                this.auctions = pageData.content;
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
        this.error = null; // Reset error on new load
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
                this.error = err.message || "Failed to load auction details";
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
                this.auctions.unshift(newAuction);
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
            const updatedAuction = await getAuctionById(req.auctionId);

            runInAction(() => {
                this.bidHistory.unshift(newBid);
                this.selectedAuction = updatedAuction;

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

    // Renamed to match Component call: cancelAuction
    cancelAuction = async (id: string) => {
        this.error = null;
        // We do NOT set isLoading=true here, because that would
        // trigger the page loader and hide the content.

        try {
            await apiCancelAuction(id);
            runInAction(() => {
                // Remove from main list if present
                this.auctions = this.auctions.filter(a => a.id !== id);

                // Update detail view status immediately
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

    // New action to manually clear errors (for the banner close button)
    clearError = () => {
        this.error = null;
    };
}

export const auctionStore = new AuctionStore();