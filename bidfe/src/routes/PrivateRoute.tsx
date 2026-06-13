import { Navigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore";
import type { ReactNode } from "react";

export const PrivateRoute = observer(
    ({ children }: { children: ReactNode }) => {
        const { authStore } = useStore();
        const location = useLocation();

        
        if (authStore.isInitializing) {
            
            return <div>Loading...</div>;
        }

        
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

        
        return <>{children}</>;
    }
);