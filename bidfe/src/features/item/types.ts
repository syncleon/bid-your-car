
// ✅ 1. Define the Image structure (matches backend DTO)
export interface ItemImageDto {
    id: string;
    originalUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
    fullHdUrl: string;
}

// ✅ 2. Update ItemDto to include the images array
export interface ItemDto {
    id: string;
    make: string;
    model: string;
    vin: string;
    location: string;
    buyNowPrice?: number;

    // Optional Specs
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;

    // ✅ The list of images from the backend
    images: ItemImageDto[];

    // seller: UserDto;
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