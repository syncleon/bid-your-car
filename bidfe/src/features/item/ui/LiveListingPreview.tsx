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

    const displayYear = isPristine ? "2024" : formData.year;
    const displayMake = isPristine ? "Porsche" : formData.make;
    const displayModel = isPristine ? "911 GT3 RS" : formData.model;
    const displayTitle = (isPristine || displayMake || displayModel) ? `${displayYear} ${displayMake} ${displayModel}`.trim() : "Start filling out your listing...";

    const displayMileage = isPristine ? "1,200" : (formData.mileage ? Number(formData.mileage).toLocaleString() : "—");
    const displayLocation = isPristine ? "Miami, FL" : (formData.location || "Location pending");
    const displaySubtitle = `${displayMileage} miles • ${displayLocation}`;

    const displayEngine = isPristine ? "4.0L Flat-6" : formData.engine;
    const displayTransmission = isPristine ? "Automatic" : formData.transmission;
    const displayDrivetrain = isPristine ? "RWD" : formData.drivetrain;
    const displayColor = isPristine ? "Black" : formData.exteriorColor;
    const displayInterior = isPristine ? "Black Leather" : formData.interiorColor;
    const displayBodyStyle = isPristine ? "Coupe" : formData.bodyStyle;
    const displayFuel = isPristine ? "Gasoline" : formData.fuelType;
    const displayTitleStatus = isPristine ? "Clean" : formData.titleStatus;

    return (
        <div className="live-preview-container">
            <div className="demo-auction-card">
                <div className="demo-card-image-wrapper">
                    <img src={previewImage || "/premium-hero-car.jpg"} alt="Preview" className="demo-card-image" />
                    <div className="demo-card-badges">
                        <span className="demo-badge badge-live">
                            <span className="live-dot-small"></span> LIVE AUCTION
                        </span>
                    </div>
                </div>
                
                <div className="demo-card-title-bar">
                    <h3>{displayTitle}</h3>
                    <p>{displaySubtitle}</p>
                </div>

                <div className="demo-card-specs">
                    {displayEngine && (
                        <div className="spec-item">
                            <span className="spec-label">Engine</span>
                            <span className="spec-value" title={displayEngine}>{displayEngine}</span>
                        </div>
                    )}
                    {displayTransmission && (
                        <div className="spec-item">
                            <span className="spec-label">Transmission</span>
                            <span className="spec-value" title={displayTransmission}>{displayTransmission}</span>
                        </div>
                    )}
                    {displayDrivetrain && (
                        <div className="spec-item">
                            <span className="spec-label">Drivetrain</span>
                            <span className="spec-value" title={displayDrivetrain}>{displayDrivetrain}</span>
                        </div>
                    )}
                    {displayBodyStyle && (
                        <div className="spec-item">
                            <span className="spec-label">Body Style</span>
                            <span className="spec-value" title={displayBodyStyle}>{displayBodyStyle}</span>
                        </div>
                    )}
                    {displayColor && (
                        <div className="spec-item">
                            <span className="spec-label">Exterior</span>
                            <span className="spec-value" title={displayColor}>{displayColor}</span>
                        </div>
                    )}
                    {displayInterior && (
                        <div className="spec-item">
                            <span className="spec-label">Interior</span>
                            <span className="spec-value" title={displayInterior}>{displayInterior}</span>
                        </div>
                    )}
                    {displayFuel && (
                        <div className="spec-item">
                            <span className="spec-label">Fuel Type</span>
                            <span className="spec-value" title={displayFuel}>{displayFuel}</span>
                        </div>
                    )}
                    {displayTitleStatus && (
                        <div className="spec-item">
                            <span className="spec-label">Title</span>
                            <span className="spec-value" title={displayTitleStatus}>{displayTitleStatus}</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .live-preview-container {
                    width: 100%;
                    margin: 0 auto;
                }
                .demo-auction-card {
                    background: #111113;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    height: 680px !important;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    box-sizing: border-box;
                }
                .demo-card-image-wrapper {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16/9;
                    overflow: hidden;
                }
                .demo-card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .demo-card-badges {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    display: flex;
                    gap: 8px;
                }
                .demo-badge {
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .demo-badge.badge-live {
                    background: rgba(0, 0, 0, 0.8);
                    color: #fff;
                }
                .live-dot-small {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: #ef4444;
                    display: block;
                }
                
                .demo-card-title-bar {
                    padding: 16px 24px 12px;
                    background: #111113;
                }
                .demo-card-title-bar h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.02em;
                }
                .demo-card-title-bar p {
                    margin: 4px 0 0;
                    font-size: 14px;
                    color: #a1a1aa;
                    font-weight: 500;
                }
                
                .demo-card-specs {
                    padding: 0 24px 20px;
                    background: #111113;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px 16px;
                }
                
                .spec-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    overflow: hidden;
                }
                
                .spec-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #71717a;
                    font-weight: 700;
                }
                
                .spec-value {
                    font-size: 14px;
                    color: #e4e4e7;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </div>
    );
};
