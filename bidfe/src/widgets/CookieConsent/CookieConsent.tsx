import { useState } from "react";
import { Link } from "react-router-dom";
import "./CookieConsent.css";

export const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(() => !localStorage.getItem("cookieConsent"));

    const handleAccept = () => {
        localStorage.setItem("cookieConsent", "accepted");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-consent-overlay">
            <div className="cookie-consent-card">
                <div className="cookie-consent-text">
                    <h3 className="cookie-consent-title">We value your privacy</h3>
                    <p className="cookie-consent-desc">
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies. <Link to="/cookie-policy" className="cookie-policy-link">Learn more</Link>
                    </p>
                </div>
                <div className="cookie-consent-actions">
                    <button className="cookie-btn cookie-btn-accept" onClick={handleAccept}>
                        Accept Cookies
                    </button>
                </div>
            </div>
        </div>
    );
};
