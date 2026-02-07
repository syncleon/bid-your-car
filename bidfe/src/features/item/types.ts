// ✅ NEW: Generic Page interface matching Spring Data
import type {AuctionDto} from "../auction/types.ts";

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
    seller: SellerDto;
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
    auction?: AuctionDto | null;
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

export interface ItemUpdateRequest {
    vin?: string;
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