import { Routes, Route } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SellCarPage } from "../pages/SellCarPage";
import { SubmitItemPage } from "../pages/SubmitItemPage.tsx";
import { PrivateRoute } from "../routes/PrivateRoute";
import { VerifyPage } from "../pages/VerifyPage.tsx";
import { AuctionPage } from "../pages/AuctionPage.tsx";
import {AuctionDetailsPage} from "../features/auction/ui/AuctionDetails.tsx";
import {ItemDetailsPage} from "../features/item/ui/ItemDetailsPage.tsx";


export const AppRouter = () => (
    <Routes>
        {/* Home / Auction Feed */}
        <Route path="/" element={<AuctionPage />} />
        <Route path="/auctions" element={<AuctionPage />} />

        {/* ✅ New Detail Route */}
        <Route path="/auctions/:id" element={<AuctionDetailsPage />} />
        <Route path="/items/:id" element={<ItemDetailsPage />} />

        {/* Public Routes */}
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
);