import type { AuctionDto } from "../auction/types";
import type {UserDto} from "../auth/types.ts";

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

export type ItemStatus =
    | "DRAFT"          // Being created by seller
    | "ACTIVE_AUCTION"  // Currently live in an auction
    | "SOLD"            // Payment pending/complete
    | "ARCHIVED"        // Soft deleted or very old;

export type AuctionStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "SCHEDULED"
    | "ACTIVE"
    | "ENDED_PENDING"
    | "SOLD"
    | "UNSOLD"
    | "CANCELLED";

export interface ItemImageDto {
    id: string;
    url: string;
    sortOrder: number;
}

export interface ItemDto {
    id: string;
    status: ItemStatus;
    year: number;
    make: string;
    model: string;
    vin: string;
    location: string;
    mileage: number;
    description: string | null;
    seller: UserDto;
    thumbnailUrl: string | null;

    // Technical Specs
    engine: string | null;
    drivetrain: string | null;
    transmission: string | null;
    bodyStyle: string | null;
    exteriorColor: string | null;
    interiorColor: string | null;
    sellerType: string | null;

    images: ItemImageDto[];

    // Auction Context (Optional depending on join)
    auctionStatus?: AuctionStatus | null;
    activeAuctionId?: string | null;
    auction?: AuctionDto | null;
}

export interface ItemCreateRequest {
    year: number;
    make: string;
    model: string;
    vin: string;
    location: string;
    mileage: number;
    description?: string;
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;
}

export interface ItemUpdateRequest {
    year?: number;
    make?: string;
    model?: string;
    location?: string;
    mileage?: number;
    description?: string;
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;
    keepImageIds?: string[];
}