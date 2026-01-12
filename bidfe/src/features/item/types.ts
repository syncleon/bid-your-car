export interface ItemImageDto {
    id: string;
    originalUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
    fullHdUrl: string;
}

export interface ItemDto {
    id: string;
    make: string;
    model: string;
    vin: string;
    location: string;
    buyNowPrice?: number;
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;
    images: ItemImageDto[];
}

export interface ItemSubmitRequest {
    make: string;
    model: string;
    vin: string;
    location: string;
    buyNowPrice: number | null;
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;
}