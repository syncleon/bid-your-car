import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStoreContext } from "../../app/providers/useStoreContext";
import { observer } from "mobx-react-lite";
import { ArrowRight, CheckCircle2, Clock, TrendingUp, MessageSquare } from "lucide-react";
import { SubmitItemForm } from "../../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest, ImageCategory } from "../../features/item/types";
import "./SellCarPage.css";

export const SellCarPage = observer(() => {
    const navigate = useNavigate();
    const { authStore, itemStore } = useStoreContext();
    
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15330); // 4h 15m 30s
    
    // Simulation state
    const [currentBid, setCurrentBid] = useState(285000);
    const [bidCount, setBidCount] = useState(24);
    const [commentCount, setCommentCount] = useState(18);
    const [highlightBid, setHighlightBid] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        
        const countdown = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        
        let timeoutId: ReturnType<typeof setTimeout>;
        const scheduleNextActivity = () => {
            const nextDelay = 3000 + Math.random() * 4000;
            timeoutId = setTimeout(() => {
                const isBid = Math.random() > 0.3;
                
                if (isBid) {
                    const increment = [500, 1000, 2000, 5000][Math.floor(Math.random() * 4)];
                    setCurrentBid(prev => prev + increment);
                    setBidCount(prev => prev + 1);
                    setHighlightBid(true);
                    setTimeout(() => setHighlightBid(false), 1000);
                } else {
                    setCommentCount(prev => prev + 1);
                }
                
                scheduleNextActivity();
            }, nextDelay);
        };
        scheduleNextActivity();
        
        return () => {
            clearInterval(countdown);
            clearTimeout(timeoutId);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStartListing = () => {
        if (authStore.user) {
            setIsSubmitting(true);
        } else {
            navigate("/login");
        }
    };

    const handleFormSubmit = async (
        data: ItemCreateRequest,
        filesWithCategories: { file: File; category: ImageCategory }[]
    ) => {
        const newItem = await itemStore.submitNewItem(data, filesWithCategories);
        if (newItem) {
            navigate(`/items/${newItem.id}`);
        }
    };

    return (
        <div className={`sell-car-page ${isVisible ? 'fade-in' : ''}`}>
            {/* Global Ambient Glow */}
            <div className="ambient-glow top-right"></div>
            <div className="ambient-glow bottom-left"></div>

            {/* Hero Section */}
            <section className="modern-hero-section">
                <div className={`hero-content-wrapper ${isSubmitting ? 'is-submitting' : ''}`}>
                    {isSubmitting ? (
                        <div style={{ display: 'contents' }}>
                            <SubmitItemForm 
                                onSubmit={handleFormSubmit}
                                onCancel={() => setIsSubmitting(false)}
                                submitLabel="Create Listing"
                                isLoading={itemStore.isLoading}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="hero-text-block fade-in-up">
                                <h1 className="hero-title">
                                    Sell your car to a <br className="hidden-mobile" />
                                    <span className="text-gradient">community</span> that <br className="hidden-mobile" />
                                    values it.
                                </h1>
                                <p className="hero-subtitle">
                                    Skip the tire-kickers and lowballers. Submit your vehicle in minutes, let our experts craft a curated listing, and watch the bids roll in during a live 7-day auction.
                                </p>
                                
                                <div className="hero-cta-group">
                                    <button className="primary-cta-btn glow-effect hover-scale" onClick={handleStartListing}>
                                        Submit Your Vehicle
                                        <ArrowRight size={20} />
                                    </button>
                                    <span className="cta-hint">
                                        <CheckCircle2 size={16} />
                                        Free to list • Expert curation • Secure process
                                    </span>
                                </div>
                            </div>

                            <div className="hero-interactive-block fade-in-up">
                                <div className="demo-auction-card">
                                    <div className="demo-card-image-wrapper">
                                        <img src="/premium-hero-car.jpg" alt="Premium sports car" className="demo-card-image" />
                                        <div className="demo-card-badges">
                                            <span className="demo-badge badge-live">
                                                <span className="live-dot-small"></span> LIVE AUCTION
                                            </span>
                                        </div>
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
                                                <span className="stat-value">{commentCount}</span>
                                            </div>
                                        </div>
                                        <button className={`demo-bar-btn ${highlightBid ? 'btn-pulse' : ''}`}>Place Bid</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
});
