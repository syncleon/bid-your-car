import { http } from "../../../shared/api/HttpClient.ts";
import { tokenStorage } from "../../../shared/lib/token.ts";
import type { AuctionDto, CreateAuctionDto, BidResp, PlaceBidReq } from "../types.ts";

const BASE_URL = "http://localhost:8080/api/v1/auctions";

/**
 * Creates a new auction listing.
 * Strictly follows the CreateAuctionDto which maps to Kotlin's ItemCreateRequest logic.
 */
export const createAuction = async (data: CreateAuctionDto): Promise<AuctionDto> => {
    const token = tokenStorage.get();
    if (!token) throw new Error("Authentication required to create an auction.");

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create auction");
    }

    return response.json();
};

/**
 * Places a bid on an active auction.
 * The bidderId is extracted from the JWT on the backend for security.
 */
export const placeBid = async (req: PlaceBidReq): Promise<BidResp> => {
    const token = tokenStorage.get();
    if (!token) throw new Error("Please log in to place a bid.");

    // Using URLSearchParams because your controller expects @RequestParam for 'amount'
    const response = await fetch(`${BASE_URL}/${req.auctionId}/bid?amount=${req.amount}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        // This will catch logic errors like "Bid amount must be at least X"
        throw new Error(errorText || "Failed to place bid");
    }

    return response.json();
};

/**
 * Fetches all auctions, optionally filtered by status.
 */
export const getAllAuctions = (status?: string) =>
    http<AuctionDto[]>(status ? `/auctions?status=${status}` : "/auctions", { method: "GET" });

/**
 * Fetches single auction details by ID.
 */
export const getAuctionById = (id: string) =>
    http<AuctionDto>(`/auctions/${id}`, { method: "GET" });

/**
 * Fetches auctions ending soon (Top 10 by default).
 */
export const getEndingSoon = (limit: number = 10) =>
    http<AuctionDto[]>(`/auctions/ending-soon?limit=${limit}`, { method: "GET" });

/**
 * Fetches the current user's won auctions.
 */
export const getMyWins = () =>
    http<AuctionDto[]>("/auctions/my-wins", { method: "GET" });

/**
 * Cancels an auction (restricted to owners/admins).
 */
export const cancelAuction = (id: string) =>
    http<void>(`/auctions/${id}`, { method: "DELETE" });

/**
 * Fetches the full bid history for a specific auction.
 */
export const getAuctionBidHistory = (auctionId: string) =>
    http<BidResp[]>(`/bids/auction/${auctionId}`, { method: "GET" });