import { Link } from "react-router-dom";
import "./Navbar.css";

interface Props {
    isAuthenticated: boolean;
    onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated, onLogout }: Props) => {
    return (
        <header className="navbar">
            <Link to="/" className="navbar__logo">
                AuctionApp
            </Link>

            <nav className="navbar__actions">
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
                        Login / Sign up
                    </Link>
                )}
            </nav>
        </header>
    );
};