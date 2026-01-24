export interface ItemImageDto {
    /** Unique ID for database referencing (e.g., for deletion) */
    id: string;
    /** Raw S3 URL */
    originalUrl: string;
    /** List/Grid view optimized (400x300px) */
    thumbnailUrl: string;
    /** Main details page optimized (1000px) */
    previewUrl: string;
    /** Full resolution for zoom/lightbox */
    fullHdUrl: string;
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
    seller: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    engine: string | null;
    drivetrain: string | null;
    transmission: string | null;
    bodyStyle: string | null;
    exteriorColor: string | null;
    interiorColor: string | null;
    sellerType: string | null;
    titleStatus: string | null;
    buyNowPrice: number | null;
    images: ItemImageDto[];
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
    titleStatus?: string;
    buyNowPrice?: number;
}