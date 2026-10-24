import { Clock } from "lucide-react";
import { BaseCard, CardBadge, CardPricePill, CardSpecsGrid } from "../../../widgets/BaseCard/BaseCard";
import type { ConditionGrade } from "../types";

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
    const isPristine = !formData.make && !formData.model && (!formData.location || formData.location === "") && !formData.engine && !formData.transmission && !formData.drivetrain && !formData.exteriorColor;

    const displayYear = isPristine ? 2024 : (formData.year || 2024);
    const displayMake = isPristine ? "Porsche" : (formData.make || "Porsche");
    const displayModel = isPristine ? "911 GT3 RS" : (formData.model || "Listing");

    const displayMileage = isPristine ? 1200 : (formData.mileage ? Number(formData.mileage) : null);
    const displayLocation = isPristine ? "Miami, FL" : (formData.location || "Location pending");
    const displayEngine = isPristine ? "4.0L Flat-6" : (formData.engine || null);
    const displayFuel = isPristine ? "Gasoline" : (formData.fuelType || null);
    const displayTransmission = isPristine ? "Automatic" : (formData.transmission || null);
    const displayTitleStatus = isPristine ? "Clean" : (formData.titleStatus || null);

    return (
        <div className="live-preview-container">
            <div className="live-preview-card-box">
                <BaseCard
                    imageUrl={previewImage || "/premium-hero-car.jpg"}
                    title={{ year: displayYear, make: displayMake, model: displayModel }}
                    overlays={{
                        topLeft: (
                            <CardBadge dotColor="var(--color-danger-text)">
                                Live
                            </CardBadge>
                        ),
                        topRight: displayTitleStatus ? (
                            <CardBadge>{`${displayTitleStatus} Title`}</CardBadge>
                        ) : undefined,
                        bottomLeft: (
                            <CardPricePill
                                priceLabel="Starting Bid"
                                priceValue="$0"
                                rightContent={
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Clock size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: "15px" }}>7 days</span>
                                    </div>
                                }
                            />
                        )
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flexGrow: 1,
                            gap: "4px",
                            paddingBottom: "2px",
                            minWidth: 0,
                        }}
                    >
                        <CardSpecsGrid
                            mileage={displayMileage}
                            transmission={displayTransmission}
                            engineOrFuel={displayEngine || displayFuel}
                            location={displayLocation}
                        />
                    </div>
                </BaseCard>
            </div>

            <style>{`
                .live-preview-container {
                    width: 100%;
                    margin: 0 auto;
                }
                .live-preview-card-box {
                    background: #111113;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    box-sizing: border-box;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .live-preview-card-box .base-card > div:last-child {
                    padding: 16px 20px 20px 20px !important;
                }
            `}</style>
        </div>
    );
};
