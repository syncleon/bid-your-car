import { tokenStorage } from "../../../shared/lib/token";
import { http } from "../../../shared/api/HttpClient";
import type {AuctionDto, CreateAuctionDto, PlaceBidReq, Page, BidDto} from "../types";

const BASE_URL = "http://localhost:8080/api/v1/auctions";

// Helper to handle the specific error format from your backend
const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        let errorMessage = `Request failed: ${response.status}`;
        try {
            const body = await response.json();
            // Match GlobalExceptionHandler structure
            if (body.error) errorMessage = body.error;
            else if (body.details) errorMessage = Object.values(body.details).join(", ");
            else if (body.message) errorMessage = body.message;
        } catch {
            const text = await response.text();
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const createAuction = async (data: CreateAuctionDto): Promise<AuctionDto> => {
    const token = tokenStorage.get();
    if (!token) throw new Error("Authentication required.");

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });

    return handleResponse<AuctionDto>(response);
};

export const placeBid = async (req: PlaceBidReq): Promise<BidDto> => {
    const token = tokenStorage.get();
    if (!token) throw new Error("Please log in to place a bid.");

    const response = await fetch(`${BASE_URL}/${req.auctionId}/bid?amount=${req.amount}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    return handleResponse<BidDto>(response);
};

// Updated: Returns Page<AuctionDto>
export const getAllAuctions = (status?: string, page = 0, size = 20) => {
    const query = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (status) query.append("status", status);

    return http<Page<AuctionDto>>(`/auctions?${query.toString()}`, { method: "GET" });
};

export const getAuctionById = (id: string) =>
    http<AuctionDto>(`/auctions/${id}`, { method: "GET" });

// Updated: Returns Page<AuctionDto>
export const getEndingSoon = (page = 0, size = 10) =>
    http<Page<AuctionDto>>(`/auctions/ending-soon?page=${page}&size=${size}`, { method: "GET" });

// Updated: Returns Page<AuctionDto>
export const getMyWins = (page = 0, size = 20) =>
    http<Page<AuctionDto>>(`/auctions/my-wins?page=${page}&size=${size}`, { method: "GET" });

export const cancelAuction = (id: string) =>
    http<void>(`/auctions/${id}`, { method: "DELETE" });

// Updated: Returns Page<BidResp>
export const getAuctionBidHistory = (auctionId: string, page = 0, size = 20) =>
    http<Page<BidDto>>(`/bids/auction/${auctionId}?page=${page}&size=${size}`, { method: "GET" });
