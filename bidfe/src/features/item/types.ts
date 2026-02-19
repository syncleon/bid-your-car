import type { AuctionDto } from "../auction/types";
import type { UserDto } from "../auth/types";

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

// --- Enums / Literal Types ---

export type ConditionGrade =
    | "EXCELLENT"
    | "VERY_GOOD"
    | "GOOD"
    | "FAIR"
    | "POOR"
    | "PARTS_ONLY";

export type ImageCategory =
    | "MAIN"
    | "EXTERIOR"
    | "INTERIOR"
    | "ENGINE"
    | "SERVICE"
    | "OTHER";

export type ItemStatus =
    | "DRAFT"           // Being created by seller
    | "PENDING_AUCTION" // Submitted, waiting for admin approval
    | "LISTED_AUCTION"  // Approved, waiting for start_time
    | "ACTIVE_AUCTION"  // Currently live in an auction
    | "SOLD"            // Auction ended, reserve met
    | "UNSOLD"          // Auction ended, reserve not met / no bids
    | "ARCHIVED";       // Soft deleted or very old

export type AuctionStatus =
    | "PENDING_APPROVAL" // Waiting for admin to approve listing
    | "SCHEDULED"        // Approved, but start_time is in the future
    | "ACTIVE"           // Live bidding is open
    | "SOLD"             // Winner declared and reserve met
    | "UNSOLD"           // Time up, no bids or reserve not met
    | "CANCELLED";       // Administratively removed

// --- Image DTO ---

export interface ItemImageDto {
    id: string;
    url: string;
    category: ImageCategory; // Added category
    sortOrder: number;
}

// --- Main Item DTO ---

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

    // --- New Mechanical & Condition Fields ---
    fuelType: string | null;
    horsepower: number | null;
    condition: ConditionGrade;
    titleStatus: string | null;
    isModified: boolean;
    hasServiceHistory: boolean;

    // --- New Pricing Logic ---
    reservePrice: number | null;
    isNoReserve: boolean;

    // --- Existing Technical Specs ---
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

// --- Requests ---

export interface ItemCreateRequest {
    year: number;
    make: string;
    model: string;
    vin: string;
    location: string;
    mileage: number;
    description?: string;

    // --- New Fields ---
    fuelType?: string;
    horsepower?: number;
    condition: ConditionGrade; // Required
    titleStatus?: string;
    isModified: boolean;
    hasServiceHistory: boolean;
    reservePrice?: number;
    isNoReserve: boolean;

    // --- Existing Specs ---
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

    // --- New Fields ---
    fuelType?: string;
    horsepower?: number;
    condition?: ConditionGrade;
    titleStatus?: string;
    isModified?: boolean;
    hasServiceHistory?: boolean;
    reservePrice?: number;
    isNoReserve?: boolean;

    // --- Existing Specs ---
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;

    keepImageIds?: string[];
}