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
import {CookiePolicyPage} from "../pages/CookiePolicyPage";

import { AdminRoute } from "../routes/AdminRoute";
import { AdminLayout } from "../widgets/AdminLayout/AdminLayout";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminAuctionsPage } from "../pages/admin/AdminAuctionsPage";

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
                <Route path="/cookie-policy" element={<CookiePolicyPage />} />
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
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminDashboardPage />
                            </AdminLayout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminUsersPage />
                            </AdminLayout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/auctions"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminAuctionsPage />
                            </AdminLayout>
                        </AdminRoute>
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