import type { ConditionGrade } from "../types";
import { AuctionCard } from "../../auction/ui/AuctionCard";
import type { AuctionDto } from "../../auction/types";

interface LiveListingPreviewProps {
    formData: {
        year: number | string;
        make: string;
        model: string;
        mileage: number | string;
        location: string;
        condition: ConditionGrade;
        transmission: string;
        drivetrain: string;
        fuelType: string;
        bodyStyle: string;
        engine: string;
        horsepower: number | string;
        exteriorColor: string;
        interiorColor: string;
        titleStatus: string;
        description: string;
    };
    previewImage: string | null;
}

export const LiveListingPreview = ({ formData, previewImage }: LiveListingPreviewProps) => {
    const displayYear = formData.year ? Number(formData.year) : new Date().getFullYear();
    const displayMake = formData.make || "Make";
    const displayModel = formData.model || "Model";


    const fakeAuction: AuctionDto = {
        id: "preview-id",
        item: {
            id: "preview-item-id",
            userId: "me",
            vin: "PREVIEWVIN123456",
            year: displayYear,
            make: displayMake,
            model: displayModel,
            mileage: formData.mileage ? Number(formData.mileage) : 0,
            location: formData.location || "City, State",
            condition: formData.condition || "GOOD",
            transmission: formData.transmission || "Unknown",
            drivetrain: formData.drivetrain || "Unknown",
            fuelType: formData.fuelType || "Unknown",
            bodyStyle: formData.bodyStyle || "Unknown",
            engine: formData.engine || "Unknown",
            horsepower: formData.horsepower ? Number(formData.horsepower) : 0,
            exteriorColor: formData.exteriorColor || "Unknown",
            interiorColor: formData.interiorColor || "Unknown",
            titleStatus: formData.titleStatus || "Unknown",
            description: formData.description || "",
            thumbnailUrl: previewImage || null,
            images: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        } as any,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "SCHEDULED",
        startPrice: 0,
        currentPrice: 0,
        minBidIncrement: 100,
        reservePrice: null,
        isNoReserve: true,
        isReserveMet: false,
        bidCount: 0,
        winnerId: null
    };

    return (
        <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Preview</span>
                </div>
            </div>
            
            <AuctionCard auction={fakeAuction} />

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};
