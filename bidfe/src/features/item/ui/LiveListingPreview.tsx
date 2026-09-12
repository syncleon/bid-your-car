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
    const displayYear = formData.year ? Number(formData.year) : new Date().getFullYear();
    const displayMake = formData.make || "Make";
    const displayModel = formData.model || "Model";

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
                    <h3>{displayYear} {displayMake} {displayModel}</h3>
                    <p>{formData.mileage ? Number(formData.mileage).toLocaleString() : '0'} miles • {formData.location || "Location"}</p>
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
                    display: flex;
                    flex-direction: column;
                    width: 100%;
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
                    font-size: 11px;
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
            `}</style>
        </div>
    );
};
