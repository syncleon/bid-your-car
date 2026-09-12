import { useState, useEffect } from "react";
import { Clock, TrendingUp, MessageSquare } from "lucide-react";
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
            <div className="demo-auction-card">
                <div className="demo-card-image-wrapper">
                    <img src={previewImage || "/placeholder-car.jpg"} alt="Preview" className="demo-card-image" />
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

                <div className="demo-card-bidding-bar">
                    <div className="demo-bar-stats">
                        <div className="demo-bar-stat">
                            <Clock size={16} color="#9ca3af" />
                            <span className="stat-label">Time Left</span>
                            <span className="stat-value">{formatTime(timeLeft)}</span>
                        </div>
                        <div className="demo-bar-stat">
                            <TrendingUp size={16} color={highlightBid ? "#10b981" : "#9ca3af"} />
                            <span className="stat-label">High Bid</span>
                            <span className={`stat-value ${highlightBid ? "highlight-flash" : ""}`}>${currentBid.toLocaleString()}</span>
                        </div>
                        <div className="demo-bar-stat">
                            <span className="stat-icon-text">#</span>
                            <span className="stat-label">Bids</span>
                            <span className={`stat-value ${highlightBid ? "highlight-flash" : ""}`}>{bidCount}</span>
                        </div>
                        <div className="demo-bar-stat">
                            <MessageSquare size={16} color="#9ca3af" />
                            <span className="stat-label">Comments</span>
                            <span className="stat-value">0</span>
                        </div>
                    </div>
                    <button className={`demo-bar-btn ${highlightBid ? 'btn-pulse' : ''}`}>Place Bid</button>
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

                .demo-card-bidding-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 24px;
                    background: #18181b;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .demo-card-bidding-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                }

                .demo-bar-stats {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    flex-wrap: wrap;
                }

                .demo-bar-stat {
                    display: flex;
                    align-items: center;
                    gap: 8px;
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

                .stat-icon-text {
                    color: #9ca3af;
                    font-size: 14px;
                    font-weight: 700;
                    margin-right: -4px;
                }

                .demo-bar-btn {
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .demo-bar-btn:hover {
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
