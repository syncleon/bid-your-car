import { Navigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore";
import type { ReactNode } from "react";

export const AdminRoute = observer(({ children }: { children: ReactNode }) => {
    const { authStore } = useStore();
    const location = useLocation();

    if (authStore.isInitializing) {
        return <div>Loading...</div>;
    }

    if (!authStore.isAuthenticated) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    const isAdmin = authStore.user?.roles.some(role => role.name === 'ADMIN');
    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
});
