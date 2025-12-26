import { Routes, Route } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ItemsPage } from "../pages/ItemsPage";
import { PrivateRoute } from "../routes/PrivateRoute";

export const AppRouter = () => (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />

        <Route
            path="/profile"
            element={
                <PrivateRoute>
                    <ProfilePage />
                </PrivateRoute>
            }
        />

        <Route path="/" element={<ItemsPage />} />
    </Routes>
);