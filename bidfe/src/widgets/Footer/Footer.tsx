import { Link } from "react-router-dom";
import "./Footer.css";

export const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__section">
                    <Link to="/" className="footer__logo">
                        BidYourCar
                    </Link>
                    <p className="footer__description">
                        The best place to buy and sell cars through exciting auctions.
                    </p>
                </div>
                
                <div className="footer__section">
                    <h3 className="footer__title">Navigation</h3>
                    <nav className="footer__nav">
                        <Link to="/" className="footer__link">Home</Link>
                        <Link to="/past-auctions" className="footer__link">Past Auctions</Link>
                        <Link to="/sell-car" className="footer__link">Sell a Car</Link>
                    </nav>
                </div>

                <div className="footer__section">
                    <h3 className="footer__title">Useful Links</h3>
                    <nav className="footer__nav">
                        <Link to="/about" className="footer__link">About Us</Link>
                        <Link to="/contact" className="footer__link">Contact</Link>
                        <Link to="/faq" className="footer__link">FAQ</Link>
                        <Link to="/terms" className="footer__link">Terms of Service</Link>
                        <Link to="/privacy" className="footer__link">Privacy Policy</Link>
                    </nav>
                </div>
            </div>
            <div className="footer__bottom">
                <p>&copy; {new Date().getFullYear()} BidYourCar. All rights reserved.</p>
            </div>
        </footer>
    );
};
