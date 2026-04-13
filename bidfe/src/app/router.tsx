import { Routes, Route, useLocation } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { SellCarPage } from "../pages/SellCarPage";
import { SubmitItemPage } from "../pages/SubmitItemPage.tsx";
import { PrivateRoute } from "../routes/PrivateRoute";
import { VerifyPage } from "../pages/VerifyPage.tsx";
import { AuctionPage } from "../pages/AuctionPage.tsx";
import { AuctionDetailsPage } from "../pages/AuctionDetailsPage.tsx";
import { ItemDetailsPage } from "../pages/ItemDetailsPage.tsx";
import {PastAuctionsPage} from "../pages/PastAuctionsPage.tsx";
import {ProfilePage} from "../pages/ProfilePage.tsx";
import {OAuth2SuccessPage} from "../pages/OAuth2SuccessPage.tsx";

export const AppRouter = () => {
    const location = useLocation();
    const state = location.state as { backgroundLocation?: Location };
    const background = state?.backgroundLocation;

    return (
        <>
            <Routes location={background || location}>
                <Route path="/" element={<AuctionPage />} />
                <Route path="/auctions" element={<AuctionPage />} />
                <Route path="/past-auctions" element={<PastAuctionsPage />} />
                <Route path="/auctions/:id" element={<AuctionDetailsPage />} />
                <Route path="/items/:id" element={<ItemDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<LoginPage />} />
                <Route path="/sell-car" element={<SellCarPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/oauth-success" element={<OAuth2SuccessPage />} />
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
            {background && (
                <Routes>
                    <Route path="/login" element={<LoginPage isModal />} />
                    <Route path="/register" element={<LoginPage isModal />} />
                </Routes>
            )}
        </>
    );
};