import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useStoreContext } from "../../app/providers/useStoreContext";
import { observer } from "mobx-react-lite";
import "./Navbar.css";

interface Props {
    isAuthenticated: boolean;
    isInitializing?: boolean;
    onLogout?: () => void;
}



const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

export const Navbar = observer(({ isAuthenticated, isInitializing = false }: Props) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { authStore } = useStoreContext();
    const user = authStore.user;

    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("q") || "";

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (location.pathname !== "/" && location.pathname !== "/past-auctions") {
            navigate(`/?q=${encodeURIComponent(val)}`);
            return;
        }
        
        setSearchParams(prev => {
            if (val) prev.set("q", val);
            else prev.delete("q");
            return prev;
        }, { replace: true });
    };

    const handleClearSearch = () => {
        handleSearchChange({ target: { value: "" } } as any);
    };

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

                <div className="navbar__search desktop-only">
                    <span className="navbar__search-icon"><SearchIcon /></span>
                    <input
                        className="navbar__search-input"
                        type="search"
                        name="q"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        placeholder="Search make, model, location…"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    {searchQuery && (
                        <button style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', fontSize: '18px' }} onClick={handleClearSearch}>
                            ×
                        </button>
                    )}
                </div>

                <div className="navbar__right desktop-only">
                    {isInitializing ? (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        </div>
                    ) : isAuthenticated ? (
                        <div className="user-menu">
                            <Link
                                to="/profile"
                                className="user-menu__trigger"
                            >
                                <div className="user-avatar-placeholder">
                                    {user?.profilePhotoUrl ? (
                                        <img src={user.profilePhotoUrl} alt="Avatar" className="user-avatar-image" />
                                    ) : user?.username ? (
                                        user.username.charAt(0).toUpperCase()
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    )}
                                </div>
                                <span className="user-menu__name">
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