import type { ConditionGrade, ItemImageDto } from "../types";

export interface ItemFormData {
    mileage: number | "";
    horsepower: number | "";
    reservePrice: number | "";
    images: ItemImageDto[];
    make: string;
    model: string;
    year: number;
    vin: string;
    location: string;
    description: string;
    engine: string;
    transmission: string;
    drivetrain: string;
    bodyStyle: string;
    exteriorColor: string;
    interiorColor: string;
    sellerType: string;
    fuelType: string;
    condition: ConditionGrade;
    titleStatus: string;
    isModified: boolean;
    hasServiceHistory: boolean;
    isNoReserve: boolean;
}
