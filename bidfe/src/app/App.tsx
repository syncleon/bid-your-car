import { observer } from "mobx-react-lite";

import { Navbar } from "../widgets/Navbar/Navbar";
import { Footer } from "../widgets/Footer";
import { useStore } from "../shared/hooks/useStore";
import { AppRouter } from "./router";
import { ThemeProvider } from "./providers/ThemeProvider";
import { CookieConsent } from "../widgets/CookieConsent/CookieConsent";

export const App = observer(() => {
    const { authStore } = useStore();

    return (
        <ThemeProvider>
            <Navbar
                isAuthenticated={authStore.isAuthenticated}
                isInitializing={authStore.isInitializing}
            />
            <AppRouter />
            <Footer />
            <CookieConsent />
        </ThemeProvider>
    );
});