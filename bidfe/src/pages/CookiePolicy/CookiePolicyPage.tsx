import { Link } from "react-router-dom";
import "./CookiePolicyPage.css";

export const CookiePolicyPage = () => {
    return (
        <div className="cookie-policy-container">
            <Link to="/" className="cookie-policy-back">← Back to Home</Link>

            <header className="cookie-policy-header">
                <h1 className="cookie-policy-title">Cookie Policy</h1>
                <p className="cookie-policy-updated">Last updated: June 13, 2026</p>
            </header>

            <section className="cookie-policy-section">
                <h2>What Are Cookies?</h2>
                <p>
                    Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and supply information to the site owners.
                </p>
            </section>

            <section className="cookie-policy-section">
                <h2>How We Use Cookies</h2>
                <p>Bid Your Car uses cookies and similar technologies for the following purposes:</p>
                <ul>
                    <li><strong>Authentication &amp; Security:</strong> We use session cookies to keep you securely logged in and to protect your account from unauthorized access.</li>
                    <li><strong>Preferences:</strong> We store your theme preference (light/dark mode) and cookie consent choice so the site remembers your settings between visits.</li>
                    <li><strong>Performance &amp; Analytics:</strong> We may use analytics cookies to understand how visitors interact with our platform, helping us improve features and performance.</li>
                </ul>
            </section>

            <section className="cookie-policy-section">
                <h2>Types of Cookies We Use</h2>
                <div className="cookie-table-wrapper">
                    <table className="cookie-table">
                        <thead>
                            <tr>
                                <th>Cookie Name</th>
                                <th>Type</th>
                                <th>Purpose</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>JSESSIONID</td>
                                <td>Essential</td>
                                <td>Maintains your authenticated session with the server</td>
                                <td>Session</td>
                            </tr>
                            <tr>
                                <td>cookieConsent</td>
                                <td>Functional</td>
                                <td>Remembers whether you have accepted our cookie policy</td>
                                <td>Persistent</td>
                            </tr>
                            <tr>
                                <td>theme</td>
                                <td>Functional</td>
                                <td>Stores your preferred color theme (light or dark)</td>
                                <td>Persistent</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="cookie-policy-section">
                <h2>Essential Cookies</h2>
                <p>
                    Essential cookies are required for the basic functionality of our platform. They enable core features such as user authentication and secure browsing. These cookies cannot be disabled as the platform would not function properly without them.
                </p>
            </section>

            <section className="cookie-policy-section">
                <h2>Managing Cookies</h2>
                <p>
                    You can control and manage cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul>
                    <li>View what cookies are stored and delete them individually</li>
                    <li>Block third-party cookies</li>
                    <li>Block cookies from specific sites</li>
                    <li>Block all cookies</li>
                    <li>Delete all cookies when you close your browser</li>
                </ul>
                <p>
                    Please note that if you choose to block or delete cookies, some features of Bid Your Car may not work as intended, particularly authentication and personalization features.
                </p>
            </section>

            <section className="cookie-policy-section">
                <h2>Third-Party Cookies</h2>
                <p>
                    We do not currently use third-party advertising cookies. If this changes in the future, we will update this policy and notify you through the cookie consent banner.
                </p>
            </section>

            <section className="cookie-policy-section">
                <h2>Changes to This Policy</h2>
                <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. We encourage you to review this page periodically.
                </p>
            </section>

            <section className="cookie-policy-section">
                <h2>Contact Us</h2>
                <p>
                    If you have any questions about our use of cookies, please reach out to us through the contact information provided on our platform.
                </p>
            </section>
        </div>
    );
};
