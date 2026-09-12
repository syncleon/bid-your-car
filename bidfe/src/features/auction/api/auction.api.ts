import { http } from "../../../shared/api/HttpClient";
import type { AuctionDto, BidDto, CreateAuctionDto, Page } from "../types";


export const getPublicAuctions = async (status?: string, filter?: string, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) params.append("status", status);
    if (filter) params.append("filter", filter);

    return http<Page<AuctionDto>>(`/auctions?${params.toString()}`, { method: "GET" });
};

export const getRecentlySold = async (page = 0, size = 10) => {
    return http<Page<AuctionDto>>(`/auctions/sold?page=${page}&size=${size}`, { method: "GET" });
};

export const getAuctionById = async (id: string) => {
    return http<AuctionDto>(`/auctions/${id}`, { method: "GET" });
};

export const getAuctionBidHistory = async (id: string, page = 0, size = 50) => {
    return http<Page<BidDto>>(`/bids/auction/${id}?page=${page}&size=${size}`, { method: "GET" });
};

export const createAuction = async (data: CreateAuctionDto) => {
    return http<AuctionDto>("/auctions", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const cancelAuction = async (id: string) => {
    return http<Record<string, string>>(`/auctions/${id}`, { method: "DELETE" });
};

export const getMyListings = async (page = 0, size = 20) => {
    return http<Page<AuctionDto>>(`/auctions/me/listings?page=${page}&size=${size}`, { method: "GET" });
};

export const getMyWins = async (page = 0, size = 20) => {
    return http<Page<AuctionDto>>(`/auctions/me/wins?page=${page}&size=${size}`, { method: "GET" });
};

export const placeBid = async (auctionId: string, amount: number) => {
    return http<BidDto>(`/auctions/${auctionId}/bids`, {
        method: "POST",
        body: JSON.stringify({ amount }),
    });
};

export const placeQuickBid = async (auctionId: string) => {
    return http<BidDto>(`/auctions/${auctionId}/bids/quick`, {
        method: "POST"
    });
};

export const approveAuction = async (id: string) => {
    return http<Record<string, string>>(`/auctions/${id}/approve`, { method: "PATCH" });
};

export const adminCancelAuction = async (id: string, reason?: string) => {
    const query = reason ? `?rejectionReason=${encodeURIComponent(reason)}` : "";
    return http<Record<string, string>>(`/auctions/admin/${id}/cancel${query}`, { method: "DELETE" });
};