import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllAuctions,
    getAuctionById,
    createAuction,
    placeBid,
    getEndingSoon,
    getMyWins,
    cancelAuction,
    getAuctionBidHistory
} from "../api/auction.api";
import type { AuctionDto, CreateAuctionDto, BidResp, PlaceBidReq } from "../types";

class AuctionStore {
    auctions: AuctionDto[] = [];
    endingSoon: AuctionDto[] = [];
    myWins: AuctionDto[] = [];
    selectedAuction: AuctionDto | null = null;
    bidHistory: BidResp[] = [];

    isLoading = false;
    isBidding = false; // Separate loading state for the bid button
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    // --- Data Loading ---

    loadAuctions = async (status?: string) => {
        this.isLoading = true;
        this.error = null;
        try {
            const data = await getAllAuctions(status);
            runInAction(() => {
                this.auctions = data;
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
        try {
            const [details, history] = await Promise.all([
                getAuctionById(id),
                getAuctionBidHistory(id)
            ]);
            runInAction(() => {
                this.selectedAuction = details;
                this.bidHistory = history;
                this.isLoading = false;
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load auction details";
                this.isLoading = false;
            });
        }
    };

    loadEndingSoon = async (limit?: number) => {
        try {
            const data = await getEndingSoon(limit);
            runInAction(() => {
                this.endingSoon = data;
            });
        } catch (err: any) {
            console.error("Failed to load ending soon auctions", err);
        }
    };

    loadMyWins = async () => {
        this.isLoading = true;
        try {
            const data = await getMyWins();
            runInAction(() => {
                this.myWins = data;
                this.isLoading = false;
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load won auctions";
                this.isLoading = false;
            });
        }
    };

    // --- Actions ---

    startAuction = async (data: CreateAuctionDto) => {
        this.isLoading = true;
        this.error = null;
        try {
            const newAuction = await createAuction(data);
            runInAction(() => {
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

            // After a successful bid, we should refresh the selected auction
            // to get the new 'currentHighestBid' and 'bidCount'
            const updatedAuction = await getAuctionById(req.auctionId);

            runInAction(() => {
                this.bidHistory.unshift(newBid);
                this.selectedAuction = updatedAuction;

                // Also update the auction in the main list if it exists there
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

    cancelActiveAuction = async (id: string) => {
        try {
            await cancelAuction(id);
            runInAction(() => {
                // Remove or update status locally
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
    };
}

export const auctionStore = new AuctionStore();