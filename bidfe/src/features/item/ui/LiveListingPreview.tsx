import { useState, useEffect } from "react";
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

    const [currentBid, setCurrentBid] = useState(45000);
    const [timeLeft, setTimeLeft] = useState(259200);
    const [highlightBid, setHighlightBid] = useState(false);
    const [bidCount, setBidCount] = useState(12);

    // Timer countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Simulated live bidding
    useEffect(() => {
        const bidSim = setInterval(() => {
            if (Math.random() > 0.5) {
                const increment = Math.floor(Math.random() * 5) * 500 + 500;
                setCurrentBid(prev => prev + increment);
                setBidCount(prev => prev + 1);
                
                setHighlightBid(true);
                setTimeout(() => setHighlightBid(false), 1000);
            }
        }, Math.floor(Math.random() * 4000) + 3000);

        return () => clearInterval(bidSim);
    }, []);

    const formatTime = (seconds: number) => {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (d > 0) return `${d}d ${h}h`;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="live-preview-container">
            <div className="live-preview-header">
                <div className="live-indicator">
                    <div className="live-dot" />
                    <span>Live Preview</span>
                </div>
            </div>
            
            <div className="preview-demo-card">
                <div className="preview-image-wrapper">
                    <img src={previewImage || "/premium-hero-car.jpg"} alt="Vehicle preview" className="preview-image" />
                    <div className="preview-badges">
                        <span className="badge-live">
                            <span className="live-dot-small"></span> LIVE AUCTION
                        </span>
                    </div>
                </div>
                
                <div className="preview-title-bar">
                    <h3>{displayYear} {displayMake} {displayModel}</h3>
                    <p>{formData.mileage ? Number(formData.mileage).toLocaleString() : '0'} miles • {formData.location || "Location"}</p>
                </div>

                <div className="preview-bidding-bar">
                    <div className="preview-stats">
                        <div className="preview-stat">
                            <span className="stat-label">Time Left</span>
                            <span className="stat-value">{formatTime(timeLeft)}</span>
                        </div>
                        <div className="preview-stat">
                            <span className="stat-label">High Bid</span>
                            <span className={`stat-value ${highlightBid ? "highlight-flash" : ""}`}>${currentBid.toLocaleString()}</span>
                        </div>
                        <div className="preview-stat">
                            <span className="stat-label">Bids</span>
                            <span className={`stat-value ${highlightBid ? "highlight-flash" : ""}`}>{bidCount}</span>
                        </div>
                    </div>
                    <button className={`preview-bid-btn ${highlightBid ? 'btn-pulse' : ''}`}>Place Bid</button>
                </div>
            </div>

            <style>{`
                .live-preview-container {
                    width: 100%;
                    max-width: 420px;
                    margin: 0 auto;
                }
                .live-preview-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .live-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .live-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 8px #22c55e;
                    animation: pulse-dot 2s infinite;
                }
                .live-indicator span {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.6);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .preview-demo-card {
                    background: #111113;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }
                .preview-image-wrapper {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16/10;
                    overflow: hidden;
                }
                .preview-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    background: #27272a;
                }
                .preview-badges {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    display: flex;
                    gap: 8px;
                }
                .badge-live {
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0, 0, 0, 0.8);
                    color: #fff;
                }
                .live-dot-small {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: #ef4444;
                }
                
                .preview-title-bar {
                    padding: 16px 20px 12px;
                    background: #111113;
                }
                .preview-title-bar h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.02em;
                }
                .preview-title-bar p {
                    margin: 4px 0 0;
                    font-size: 14px;
                    color: #a1a1aa;
                    font-weight: 500;
                }

                .preview-bidding-bar {
                    display: flex;
                    flex-direction: column;
                    background: #111113;
                    padding: 0 20px 20px;
                    gap: 16px;
                }
                .preview-stats {
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 16px;
                }
                .preview-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .stat-label {
                    font-size: 11px;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }
                .stat-value {
                    font-size: 16px;
                    font-weight: 700;
                    color: #fff;
                    transition: all 0.3s ease;
                }
                .highlight-flash {
                    color: #10b981 !important;
                    text-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
                    transform: scale(1.05);
                }
                .preview-bid-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .preview-bid-btn:hover {
                    background: #e5e5e5;
                }
                .btn-pulse {
                    animation: bid-btn-pulse 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @keyframes pulse-dot {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes bid-btn-pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); background: #f0fdf4; color: #166534; }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};
