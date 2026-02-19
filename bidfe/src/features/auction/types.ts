import type { ItemDto } from "../../features/item/types";

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

// MATCHED EXACTLY TO BACKEND
export type AuctionStatus =
    | "PENDING_APPROVAL"
    | "SCHEDULED"
    | "ACTIVE"
    | "SOLD"
    | "UNSOLD"
    | "CANCELLED";

export interface AuctionDto {
    id: string;
    item: ItemDto;
    startTime: string; // ISO Instant
    endTime: string;   // ISO Instant
    status: AuctionStatus;

    // Financials
    startPrice: number;
    currentPrice: number;
    minBidIncrement: number;
    reservePrice: number | null;
    isNoReserve: boolean; // <-- NEW: Inherited from Item
    isReserveMet: boolean;

    // Stats
    bidCount: number;

    // Relationships
    winnerId: number | null;
}

export interface CreateAuctionDto {
    itemId: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
    startPrice: number;
    minBidIncrement?: number;
    // NOTE: reservePrice is intentionally omitted. It is pulled from the Item automatically.
}

export interface PlaceBidReq {
    amount: number;
    // NOTE: auctionId is passed in the URL, not the body
}

export interface BidDto {
    id: string;
    auctionId: string;
    bidderId: number;
    bidderName: string;
    amount: number;
    bidTime: string;
}