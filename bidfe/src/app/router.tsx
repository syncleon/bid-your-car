import { Routes, Route } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ItemsPage } from "../pages/ItemsPage";
import { SellCarPage } from "../pages/SellCarPage";
import { SubmitItemPage } from "../pages/SubmitItemPage.tsx";
import { PrivateRoute } from "../routes/PrivateRoute";
import {VerifyPage} from "../pages/VerifyPage.tsx";

export const AppRouter = () => (
    <Routes>
        <Route path="/" element={<ItemsPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/sell-car" element={<SellCarPage />} />
        <Route path="/verify" element={<VerifyPage />} />

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
