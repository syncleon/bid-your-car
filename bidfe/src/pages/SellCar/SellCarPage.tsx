import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStoreContext } from "../../app/providers/useStoreContext";
import { observer } from "mobx-react-lite";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SubmitItemForm } from "../../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest, ImageCategory } from "../../features/item/types";
import "./SellCarPage.css";

export const SellCarPage = observer(() => {
    const navigate = useNavigate();
    const { authStore, itemStore } = useStoreContext();
    
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

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
                    <div style={{ display: isSubmitting ? 'none' : 'contents' }}>
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
                                
                                <div className="demo-card-title-bar">
                                    <h3>2024 Porsche 911 GT3 RS</h3>
                                    <p>1,200 miles • Miami, FL</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: isSubmitting ? 'contents' : 'none' }}>
                        <SubmitItemForm 
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSubmitting(false)}
                            submitLabel="Create Listing"
                            isLoading={itemStore.isLoading}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
});
