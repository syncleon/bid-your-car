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
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const { authStore } = useStoreContext();
    const user = authStore.user;

    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("q") || "";
    const [inputValue, setInputValue] = useState(searchQuery);

    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        
        if (location.pathname === "/" || location.pathname === "/past-auctions") {
            setSearchParams(prev => {
                if (val) prev.set("q", val);
                else prev.delete("q");
                return prev;
            }, { replace: true });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (location.pathname !== "/" && location.pathname !== "/past-auctions") {
                navigate(`/?q=${encodeURIComponent(inputValue)}`);
            }
        }
    };

    const handleClearSearch = () => {
        setInputValue("");
        if (location.pathname === "/" || location.pathname === "/past-auctions") {
            setSearchParams(prev => {
                prev.delete("q");
                return prev;
            }, { replace: true });
        } else {
            navigate(location.pathname);
        }
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
                        Past Auctions
                    </Link>
                    <Link to="/sell-car" className="navbar__cta">
                        Add car
                    </Link>
                </nav>

                <div className="navbar__search desktop-only">
                    <input
                        className="navbar__search-input"
                        type="search"
                        name="q"
                        autoComplete="new-password"
                        autoCorrect="off"
                        spellCheck="false"
                        placeholder="Search"
                        value={inputValue}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                    />
                    <span className="navbar__search-icon"><SearchIcon /></span>
                    {inputValue && (
                        <button className="navbar__search-clear" onClick={handleClearSearch}>
                            ×
                        </button>
                    )}
                </div>

                <div className="navbar__right desktop-only">


                    {isInitializing ? (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        </div>
                    ) : isAuthenticated ? (
                        <>
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', position: 'relative' }}>
                            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="user-menu__trigger" style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div className="user-avatar-placeholder" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                                    {user?.profilePhotoUrl ? (
                                        <img src={user.profilePhotoUrl} alt="Avatar" className="user-avatar-image" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : user?.username ? (
                                        user.username.charAt(0).toUpperCase()
                                    ) : null}
                                </div>
                            </button>
                            
                            {isProfileMenuOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setIsProfileMenuOpen(false)} />
                                    <div className="profile-dropdown" style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '12px',
                                        backgroundColor: '#1a1a1c',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        minWidth: '160px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        zIndex: 100
                                    }}>
                                        <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} style={{ padding: '8px 12px', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '6px', display: 'block', fontSize: '14px', fontWeight: 600 }}>My Profile</Link>
                                        {user?.roles?.some((r: { name: string }) => r.name === 'ADMIN') && (
                                            <Link to="/admin" onClick={() => setIsProfileMenuOpen(false)} style={{ padding: '8px 12px', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '6px', display: 'block', fontSize: '14px', fontWeight: 600 }}>Admin Dashboard</Link>
                                        )}
                                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                                        <button onClick={() => { setIsProfileMenuOpen(false); authStore.logout(); navigate('/'); }} style={{ padding: '8px 12px', color: 'var(--color-danger-text)', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', fontWeight: 600, width: '100%' }}>Logout</button>
                                    </div>
                                </>
                            )}
                        </div>
                        {isAuthenticated && (
                            <Link to="#" className="navbar__link navbar__link--orange" style={{ marginLeft: '12px' }}>
                                Try Premium
                            </Link>
                        )}
                        </>
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