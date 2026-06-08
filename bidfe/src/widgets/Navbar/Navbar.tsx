import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useStoreContext } from "../../app/providers/useStoreContext";
import { observer } from "mobx-react-lite";
import "./Navbar.css";

interface Props {
    isAuthenticated: boolean;
    onLogout?: () => void;
}



export const Navbar = observer(({ isAuthenticated }: Props) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { authStore } = useStoreContext();
    const user = authStore.user;

    const location = useLocation();

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);



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

                    {isAuthenticated ? (
                        <div className="user-menu">
                            <Link
                                to="/profile"
                                className="user-menu__trigger"
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '6px 16px 6px 6px', borderRadius: '30px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease', textDecoration: 'none' }}
                            >
                                <div className="user-avatar-placeholder" style={{ background: 'linear-gradient(135deg, var(--accent-color) 0%, #a1a1aa 100%)', color: '#fff', fontWeight: 'bold' }}>
                                    {user?.profilePhotoUrl ? (
                                        <img src={user.profilePhotoUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : user?.username ? (
                                        user.username.charAt(0).toUpperCase()
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    )}
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', letterSpacing: '-0.3px' }}>
                                    {user?.username || "Profile"}
                                </span>
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Link
                                to="/login"
                                state={{ backgroundLocation: location }}
                                className="navbar__login-btn"
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

                    <div className="mobile-divider"></div>

                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
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
});