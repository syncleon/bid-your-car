export interface ItemSubmitRequest {
    make: string;
    model: string;
    vin: string;
    location: string;

    // Optional / Nullable fields matching Entity
    buyNowPrice: number | null;
    engine: string | null;
    drivetrain: string | null;
    transmission: string | null;
    bodyStyle: string | null;
    exteriorColor: string | null;
    interiorColor: string | null;
    sellerType: string | null;
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
    // seller: UserDto; // Assuming seller is returned in GET response
}