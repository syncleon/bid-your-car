// Standard Spring Data Page Interface
import type { ItemDto } from "../item/types.ts";

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

export type AuctionStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "SCHEDULED"
    | "ACTIVE"
    | "ENDED_PENDING"
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
    currentPrice: number; // FIX: Renamed from currentHighestBid to match backend
    minBidIncrement: number;
    reservePrice: number | null; // FIX: Added missing reservePrice
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
    startPrice: number; // FIX: Renamed from startingBid to match backend
    reservePrice?: number;
    minBidIncrement?: number;
}

export interface PlaceBidReq {
    auctionId: string;
    amount: number;
}

export interface BidDto {
    id: string;
    auctionId: string;
    bidderId: number;
    bidderName: string;
    amount: number;
    bidTime: string;
}