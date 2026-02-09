import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

interface Props {
    isAuthenticated: boolean;
    onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated, onLogout }: Props) => {
    // Desktop Dropdown State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const location = useLocation();

    // Close Dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close Mobile Menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    return (
        <header className="navbar">
            <div className="navbar__container">
                {/* --- Logo --- */}
                <Link to="/" className="navbar__logo">
                    BidYourCar
                </Link>

                {/* --- Desktop Navigation (Hidden on Mobile) --- */}
                <nav className="navbar__nav desktop-only">
                    <Link to="/past-auctions" className="navbar__link">
                        Past Auctions
                    </Link>
                    <Link to="/sell-car" className="navbar__cta">
                        Sell a Car
                    </Link>
                </nav>

                {/* --- Desktop Right Section (Hidden on Mobile) --- */}
                <div className="navbar__right desktop-only">
                    {isAuthenticated ? (
                        <div className="user-menu" ref={menuRef}>
                            <button
                                className="user-menu__trigger"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <div className="user-avatar-placeholder">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                            </button>

                            {isMenuOpen && (
                                <div className="dropdown-menu">
                                    <Link to="/profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                        Profile
                                    </Link>
                                    <button
                                        className="dropdown-item dropdown-item--danger"
                                        onClick={() => {
                                            if (onLogout) onLogout();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Link
                                to="/login"
                                state={{ backgroundLocation: location }}
                                className="navbar__link"
                                style={{ fontWeight: 700 }}
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>

                {/* --- Mobile Menu Trigger (Visible on Mobile) --- */}
                <button
                    className="mobile-menu-trigger"
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label="Open menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* --- Mobile Overlay & Menu --- */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`}>
                <div className="mobile-menu__header">
                    <span className="navbar__logo">BidYourCar</span>
                    <button
                        className="mobile-close-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="mobile-menu__content">
                    <Link to="/past-auctions" className="mobile-link">Past Auctions</Link>
                    <Link to="/sell-car" className="mobile-link">Sell a Car</Link>

                    <div className="mobile-divider"></div>

                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className="mobile-link">Profile</Link>
                            <button
                                className="mobile-link mobile-link--danger"
                                onClick={() => {
                                    if(onLogout) onLogout();
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            state={{ backgroundLocation: location }}
                            className="mobile-link mobile-cta"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};