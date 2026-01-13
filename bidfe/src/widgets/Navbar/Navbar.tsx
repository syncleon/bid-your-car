import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

interface Props {
    isAuthenticated: boolean;
    onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated, onLogout }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="navbar">
            {/* Left: Logo, Links, and Sell Button */}
            <div className="navbar__left">
                <Link to="/" className="navbar__logo">
                    BidYourCar
                </Link>

                <nav className="navbar__nav">
                    <Link to="/auctions" className="navbar__link">
                        Auctions
                    </Link>
                    {/* Left Aligned Sell Button (Black Pill) */}
                    <Link to="/sell-car" className="navbar__cta">
                        Sell a Car
                    </Link>
                </nav>
            </div>

            {/* Center: Search */}
            <div className="navbar__center">
                <div className="search-wrapper">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        className="navbar__search"
                        placeholder="Search your future car"
                    />
                </div>
            </div>

            {/* Right: User Actions */}
            <div className="navbar__right">
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
                                <Link
                                    to="/profile"
                                    className="dropdown-item"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <button
                                    className="dropdown-item dropdown-item--danger"
                                    onClick={() => {
                                        if(onLogout) onLogout();
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="navbar__link" style={{ fontWeight: 700 }}>
                        Sign In
                    </Link>
                )}
            </div>
        </header>
    );
};