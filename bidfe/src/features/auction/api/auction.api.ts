import { http } from "../../../shared/api/HttpClient";
import type { AuctionDto, CreateAuctionDto, PlaceBidReq, Page, BidDto } from "../types";

/**
 * Helper to build common query params
 */
const getPagerParams = (page: number, size: number) =>
    new URLSearchParams({ page: page.toString(), size: size.toString() });

// ========================================================================
//  PUBLIC ENDPOINTS
// ========================================================================

export const getAllAuctions = (filter?: string, status?: string, page = 0, size = 20) => {
    const query = getPagerParams(page, size);
    if (filter) query.append("filter", filter);
    if (status) query.append("status", status); // ✅ Now supports status filtering

    return http<Page<AuctionDto>>(`/auctions?${query.toString()}`, {
        method: "GET",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });
};

// NEW: Matches the recently added backend endpoint
export const getRecentlySold = (page = 0, size = 10) => {
    const query = getPagerParams(page, size);
    return http<Page<AuctionDto>>(`/auctions/sold?${query.toString()}`, {
        method: "GET",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });
};

export const getAuctionById = (id: string) =>
    http<AuctionDto>(`/auctions/${id}`, {
        method: "GET",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });

export const getEndingSoon = (page = 0, size = 10) =>
    getAllAuctions("ending_soon", undefined, page, size);

// ========================================================================
//  USER / SELLER ENDPOINTS
// ========================================================================

export const createAuction = (data: CreateAuctionDto) =>
    http<AuctionDto>("/auctions", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });

export const placeBid = (req: PlaceBidReq) =>
    http<BidDto>(`/auctions/${req.auctionId}/bids`, {
        method: "POST",
        body: JSON.stringify({ amount: req.amount }),
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });

export const getMyWins = (page = 0, size = 20) => {
    const query = getPagerParams(page, size);
    return http<Page<AuctionDto>>(`/auctions/me/wins?${query.toString()}`, {
        method: "GET",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });
};

export const getMyListings = (page = 0, size = 20) => {
    const query = getPagerParams(page, size);
    return http<Page<AuctionDto>>(`/auctions/me/listings?${query.toString()}`, {
        method: "GET",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });
};

export const cancelAuction = (id: string) =>
    http<Record<string, string>>(`/auctions/${id}`, {
        method: "DELETE",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });

// ========================================================================
//  ADMIN ENDPOINTS
// ========================================================================

export const approveAuction = (id: string) =>
    http<Record<string, string>>(`/auctions/${id}/approve`, {
        method: "PATCH",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });

export const adminCancelAuction = (id: string) =>
    http<Record<string, string>>(`/auctions/admin/${id}/cancel`, {
        method: "DELETE",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });

// ========================================================================
//  BID HISTORY
// ========================================================================

export const getAuctionBidHistory = (auctionId: string, page = 0, size = 10000) => {
    const query = getPagerParams(page, size);
    return http<Page<BidDto>>(`/bids/auction/${auctionId}?${query.toString()}`, {
        method: "GET",
        headers: { "Bypass-Tunnel-Reminder": "true" }
    });
};