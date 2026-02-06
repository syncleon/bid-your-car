import { Routes, Route, useLocation } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { SellCarPage } from "../pages/SellCarPage";
import { SubmitItemPage } from "../pages/SubmitItemPage.tsx";
import { PrivateRoute } from "../routes/PrivateRoute";
import { VerifyPage } from "../pages/VerifyPage.tsx";
import { AuctionPage } from "../pages/AuctionPage.tsx";
import { AuctionDetailsPage } from "../features/auction/ui/AuctionDetailsPage.tsx";
import { ItemDetailsPage } from "../features/item/ui/ItemDetailsPage.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";

export const AppRouter = () => {
    const location = useLocation();

    // 1. Detect if we have a "background" state.
    // If state.backgroundLocation is present, it means the user clicked a link
    // that set it (e.g., from a Navbar), so we should render that background
    // page underneath the modal.
    const state = location.state as { backgroundLocation?: Location };
    const background = state?.backgroundLocation;

    return (
        <>
            {/* 2. Main Routes: Render the `background` if it exists; otherwise render `location`.
                   This ensures the "page behind the modal" stays visible. */}
            <Routes location={background || location}>
                {/* Home / Auction Feed */}
                <Route path="/" element={<AuctionPage />} />
                <Route path="/auctions" element={<AuctionPage />} />

                <Route path="/auctions/:id" element={<AuctionDetailsPage />} />
                <Route path="/items/:id" element={<ItemDetailsPage />} />

                {/* Public Routes */}
                {/* Note: These handle the "Full Page" version if user refreshes /login */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<LoginPage />} />

                <Route path="/sell-car" element={<SellCarPage />} />
                <Route path="/verify" element={<VerifyPage />} />

                {/* Private Routes */}
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/sell-car/submit"
                    element={
                        <PrivateRoute>
                            <SubmitItemPage />
                        </PrivateRoute>
                    }
                />
            </Routes>

            {/* 3. Modal Routes: Only render these if background exists.
                   These render ON TOP of the Routes above. */}
            {background && (
                <Routes>
                    <Route path="/login" element={<LoginPage isModal />} />
                    <Route path="/register" element={<LoginPage isModal />} />
                </Routes>
            )}
        </>
    );
};