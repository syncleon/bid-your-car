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
    | "PENDING_APPROVAL"
    | "SCHEDULED"
    | "ACTIVE"
    | "SOLD"
    | "UNSOLD"
    | "CANCELLED";

export interface AuctionDto {
    id: string;
    item: ItemDto;
    startTime: string;
    endTime: string;
    status: AuctionStatus;
    startPrice: number;
    currentPrice: number;
    minBidIncrement: number;
    reservePrice: number | null;
    isNoReserve: boolean;
    isReserveMet: boolean;
    bidCount: number;
    winnerId: number | null;
}

export interface CreateAuctionDto {
    itemId: string;
    startTime: string;
    endTime: string;
    startPrice: number;
    minBidIncrement?: number;
    reservePrice?: number | null;
    isNoReserve: boolean;
}

export interface PlaceBidReq {
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