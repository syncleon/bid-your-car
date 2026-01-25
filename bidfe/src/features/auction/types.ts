import type {ItemDto} from "../item/types.ts";

export type AuctionStatus = 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'CANCELLED';

export interface AuctionDto {
    id: string;
    item: ItemDto;
    startTime: string;
    endTime: string;
    status: AuctionStatus;
    startPrice: number;
    minBidIncrement: number;
    currentHighestBid: number | null;
    minNextBid: number;
    bidCount: number;
    isReserveMet: boolean | null;
    winnerId: number | null;
}

export interface CreateAuctionDto {
    itemId: string;
    startTime: string;
    endTime: string;
    startingBid: number;
    reservePrice?: number;
    minBidIncrement?: number;
}

export interface PlaceBidReq {
    auctionId: string;
    amount: number;
}

export interface BidResp {
    id: string;
    auctionId: string;
    bidderId: number;
    bidderName: string;
    amount: number;
    bidTime: string;
}