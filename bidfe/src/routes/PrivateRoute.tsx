import { Navigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore";
import type { ReactNode } from "react";

export const PrivateRoute = observer(
    ({ children }: { children: ReactNode }) => {
        const { authStore } = useStore();
        const location = useLocation();

        // 1. Wait for the initial checkAuth() to complete
        if (authStore.isInitializing) {
            // You can replace this with a proper Spinner or Loading component
            return <div>Loading...</div>;
        }

        // 2. Redirect only if initialization is done and the user is still not authenticated
        if (!authStore.isAuthenticated) {
            return (
                <Navigate
                    to={`/login?redirect=${encodeURIComponent(
                        location.pathname
                    )}`}
                    replace
                />
            );
        }

        // 3. Render the protected component
        return <>{children}</>;
    }
);