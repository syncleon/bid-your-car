import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../app/providers/ThemeProvider";
import "./Navbar.css";

interface Props {
    isAuthenticated: boolean;
    onLogout?: () => void;
}

interface ThemeToggleButtonProps {
    isMobile?: boolean;
    theme: string;
    toggleTheme: () => void;
}

const ThemeToggleButton = ({ isMobile = false, theme, toggleTheme }: ThemeToggleButtonProps) => {
    const handleToggleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('[Navbar] Theme toggled. Current theme was:', theme);
        toggleTheme();
    };

    return (
        <button
            onClick={handleToggleClick}
            aria-label="Toggle theme"
            style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "12px" : "0",
                padding: isMobile ? "16px 0" : "8px",
                fontSize: isMobile ? "20px" : "inherit",
                fontWeight: isMobile ? 600 : "normal",
                borderBottom: isMobile ? "1px solid var(--border-light)" : "none",
                width: isMobile ? "100%" : "auto",
                textAlign: "left"
            }}
        >
            {theme === 'light' ? (
                <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    {isMobile && "Dark Mode"}
                </>
            ) : (
                <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    {isMobile && "Light Mode"}
                </>
            )}
        </button>
    );
};

export const Navbar = ({ isAuthenticated, onLogout }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                <Link to="/" className="navbar__logo">
                    BidYourCar
                </Link>

                <nav className="navbar__nav desktop-only">
                    <Link to="/past-auctions" className="navbar__link">
                        Past Auctions
                    </Link>
                    <Link to="/sell-car" className="navbar__cta">
                        Sell a Car
                    </Link>
                </nav>

                <div className="navbar__right desktop-only">
                    <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />

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
                    <Link
                        to="/sell-car"
                        className="mobile-link mobile-cta"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Sell a Car
                    </Link>

                    <ThemeToggleButton isMobile={true} theme={theme} toggleTheme={toggleTheme} />

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