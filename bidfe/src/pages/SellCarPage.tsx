import { useNavigate, useLocation } from "react-router-dom";
import { useStoreContext } from "../app/providers/useStoreContext";
import { observer } from "mobx-react-lite";
import "./SellCarPage.css";

const CameraIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const GavelIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
        <path d="m9 7 8 8" />
        <path d="m21 11-8-8" />
    </svg>
);

export const SellCarPage = observer(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const { authStore } = useStoreContext();

    const handleStartListing = () => {
        if (authStore.user) {
            navigate("/sell-car/submit");
        } else {
            navigate("/login", { state: { backgroundLocation: location } });
        }
    };

    return (
        <div className="sell-car-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text-block">
                        <span className="badge">Premium Auctions</span>
                        <h1>The modern way<br />to sell your car.</h1>
                        <p className="hero-subtitle">
                            Submit your premium vehicle in minutes. Our team curates your listing, and our dedicated audience bids in a transparent, 7-day auction.
                        </p>
                        
                        <div className="hero-cta-group">
                            <button className="primary-cta-btn" onClick={handleStartListing}>
                                Start listing
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                            <span className="cta-hint">It's 100% free to list.</span>
                        </div>

                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-value">85%</span>
                                <span className="stat-label">Sell-Through Rate</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">$50M+</span>
                                <span className="stat-label">Total Sales</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">7 Days</span>
                                <span className="stat-label">Fast Auctions</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hero-image-block">
                    <img src="/premium-hero-car.jpg" alt="Premium sports car in studio lighting" className="hero-image" />
                    <div className="hero-image-overlay"></div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section">
                <div className="section-header">
                    <h2>How it works</h2>
                    <p>A transparent, hassle-free process designed for enthusiasts.</p>
                </div>
                
                <div className="steps-container">
                    {[
                        { icon: <CameraIcon />, title: "1. Submit Details", desc: "Share photos and vehicle details easily through our guided, mobile-friendly process." },
                        { icon: <ShieldIcon />, title: "2. Expert Curation", desc: "Our specialists review your submission and refine the listing to maximize buyer appeal." },
                        { icon: <GavelIcon />, title: "3. Live Auction", desc: "Go live with 7 days of transparent, high-energy bidding from our vetted community." }
                    ].map((step, idx) => (
                        <div key={idx} className="step-card">
                            <div className="step-icon">
                                {step.icon}
                            </div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="bottom-cta-section">
                <h2>Ready to find the next owner?</h2>
                <button className="primary-cta-btn" onClick={handleStartListing}>
                    Start your submission
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </section>
        </div>
    );
});