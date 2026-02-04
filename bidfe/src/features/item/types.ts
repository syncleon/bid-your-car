// ✅ NEW: Generic Page interface matching Spring Data
export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number; // Current page index (0-based)
    first: boolean;
    last: boolean;
    empty: boolean;
}

export type AuctionStatus = "DRAFT" | "ACTIVE" | "SOLD" | "EXPIRED" | "CANCELLED";

export interface ItemImageDto {
    id: string;
    originalUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
    fullHdUrl: string;
}

export interface SellerDto {
    id: number;
    username: string;
    email: string;
    // Add other UserDto fields if needed
}

export interface ItemDto {
    id: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    location: string;
    mileage: number;
    description: string | null;
    seller: SellerDto; // Updated to use strict DTO
    engine: string | null;
    drivetrain: string | null;
    transmission: string | null;
    bodyStyle: string | null;
    exteriorColor: string | null;
    interiorColor: string | null;
    sellerType: string | null;
    images: ItemImageDto[];
    auctionStatus: AuctionStatus | null;
    activeAuctionId: string | null;
    active: boolean;
    available: boolean;
    sold: boolean;
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