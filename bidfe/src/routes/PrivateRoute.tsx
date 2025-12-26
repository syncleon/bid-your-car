import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore";

interface Props {
    children: ReactNode;
}

export const PrivateRoute = observer(({ children }: Props) => {
    const { authStore } = useStore();

    if (!authStore.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
});