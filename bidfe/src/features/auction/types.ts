// Standard Spring Data Page Interface
import type {ItemDto} from "../item/types.ts";

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

export type AuctionStatus = 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'CANCELLED' | 'DRAFT';

export interface AuctionDto {
    id: string;
    item: ItemDto;
    startTime: string; // ISO Instant
    endTime: string;   // ISO Instant
    status: AuctionStatus;
    startPrice: number;
    minBidIncrement: number;
    currentHighestBid: number | null;
    bidCount: number;
    isReserveMet: boolean;
    winnerId: number | null;
}

export interface CreateAuctionDto {
    itemId: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
    startingBid: number;
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