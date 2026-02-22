import type { UserDto } from "../auth/types";
import type {AuctionDto} from "../auction/types.ts";

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

export const ITEM_STATUSES = [
    "DRAFT",
    "PENDING_AUCTION",
    "LISTED_AUCTION",
    "ACTIVE_AUCTION",
    "SOLD",
    "UNSOLD",
    "ARCHIVED",
] as const;

export type ItemStatus = typeof ITEM_STATUSES[number];

export const CONDITION_GRADES = [
    "EXCELLENT",
    "VERY_GOOD",
    "GOOD",
    "FAIR",
    "POOR",
    "PARTS_ONLY",
] as const;

export type ConditionGrade = typeof CONDITION_GRADES[number];

export const IMAGE_CATEGORIES = [
    "MAIN",
    "EXTERIOR",
    "INTERIOR",
    "ENGINE",
    "SERVICE",
    "OTHER",
] as const;

export type ImageCategory = typeof IMAGE_CATEGORIES[number];

export interface ItemImageDto {
    id: string;
    url: string;
    category: ImageCategory;
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
    fuelType: string | null;
    horsepower: number | null;
    condition: ConditionGrade;
    titleStatus: string | null;
    isModified: boolean;
    hasServiceHistory: boolean;
    reservePrice: number | null;
    isNoReserve: boolean;
    engine: string | null;
    drivetrain: string | null;
    transmission: string | null;
    bodyStyle: string | null;
    exteriorColor: string | null;
    interiorColor: string | null;
    sellerType: string | null;
    images: ItemImageDto[];
    auctionId: string | null;
    auction: AuctionDto;
}

export interface ItemCreateRequest {
    year: number;
    make: string;
    model: string;
    vin: string;
    location: string;
    mileage: number;
    description?: string;
    fuelType?: string;
    horsepower?: number;
    condition: ConditionGrade;
    titleStatus?: string;
    isModified: boolean;
    hasServiceHistory: boolean;
    reservePrice?: number;
    isNoReserve: boolean;
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
    fuelType?: string;
    horsepower?: number;
    condition?: ConditionGrade;
    titleStatus?: string;
    isModified?: boolean;
    hasServiceHistory?: boolean;
    reservePrice?: number;
    isNoReserve?: boolean;
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;
    keepImageIds?: string[];
}