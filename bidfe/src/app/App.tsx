import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { Navbar } from "../widgets/Navbar/Navbar";
import { Footer } from "../widgets/Footer";
import { useStore } from "../shared/hooks/useStore";
import { AppRouter } from "./router";
import { ThemeProvider } from "./providers/ThemeProvider";
import { CookieConsent } from "../widgets/CookieConsent/CookieConsent";
import { CreatePasswordModal } from "../features/auth/ui/CreatePasswordModal";

export const App = observer(() => {
    const { authStore } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get("setup_password") === "1" || searchParams.get("action") === "create-password") {
            setIsPasswordModalOpen(true);
        }
    }, [searchParams]);

    const handleClosePasswordModal = () => {
        setIsPasswordModalOpen(false);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("setup_password");
        newParams.delete("action");
        setSearchParams(newParams, { replace: true });
    };

    return (
        <ThemeProvider>
            <Navbar
                isAuthenticated={authStore.isAuthenticated}
                isInitializing={authStore.isInitializing}
            />
            <AppRouter />
            <Footer />
            <CookieConsent />
            <CreatePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={handleClosePasswordModal}
                onSuccess={handleClosePasswordModal}
            />
        </ThemeProvider>
    );
});