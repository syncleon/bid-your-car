import { Link } from "react-router-dom";
import "./Navbar.css";

interface Props {
    isAuthenticated: boolean;
    onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated, onLogout }: Props) => {
    return (
        <header className="navbar">
            <div className="navbar__left">
                <Link to="/" className="navbar__logo">
                    Bidyour car
                </Link>

                <Link to="/auctions" className="navbar__link">
                    Auctions
                </Link>

                {/* ✅ Always navigate to /sell */}
                <Link to="/sell-car" className="navbar__button">
                    Sell a car
                </Link>
            </div>

            <div className="navbar__center">
                <input
                    className="navbar__search"
                    placeholder="Search cars..."
                />
            </div>

            <div className="navbar__actions">
                {isAuthenticated ? (
                    <>
                        <Link to="/profile" className="navbar__link">
                            Profile
                        </Link>
                        <button className="navbar__button" onClick={onLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="navbar__button">
                        Sign up
                    </Link>
                )}
            </div>
        </header>
    );
};