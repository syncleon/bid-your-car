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

                    <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/past-auctions" className={`navbar__link ${location.pathname === '/past-auctions' ? 'active' : ''}`}>
                        Previous Auctions
                    </Link>

                </nav>

                <div className="navbar__search desktop-only">
                    <input
                        className="navbar__search-input"
                        type="search"
                        name="q"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <span className="navbar__search-icon"><SearchIcon /></span>
                    {searchQuery && (
                        <button className="navbar__search-clear" onClick={handleClearSearch}>
                            ×
                        </button>
                    )}
                </div>

                <div className="navbar__right desktop-only">
                    <Link to="#" className="navbar__link navbar__link--orange">
                        Try Premium
                    </Link>

                    <Link to="/sell-car" className="navbar__link">
                        Upload
                    </Link>

                    {isInitializing ? (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        </div>
                    ) : isAuthenticated ? (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '8px' }}>
                            <Link to="/profile" className="user-menu__trigger" style={{ padding: 0, border: 'none', background: 'none' }}>
                                <div className="user-avatar-placeholder" style={{ width: '28px', height: '28px' }}>
                                    {user?.profilePhotoUrl ? (
                                        <img src={user.profilePhotoUrl} alt="Avatar" className="user-avatar-image" />
                                    ) : user?.username ? (
                                        user.username.charAt(0).toUpperCase()
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: '#ff7733', borderRadius: '50%' }}></div>
                                    )}
                                </div>
                            </Link>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
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