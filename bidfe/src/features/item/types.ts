export interface ItemCreateRequest {
    make: string;
    model: string;
    vin: string;
    location: string;
    engine?: string;
    drivetrain?: string;
    transmission?: string;
    bodyStyle?: string;
    exteriorColor?: string;
    interiorColor?: string;
    sellerType?: string;
    buyNowPrice?: number;
}