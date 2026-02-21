import { observer } from "mobx-react-lite";
import { Navbar } from "../widgets/Navbar/Navbar";
import { useStore } from "../shared/hooks/useStore";
import { AppRouter } from "./router";
// 1. Import the ThemeProvider
import { ThemeProvider } from "./providers/ThemeProvider";

export const App = observer(() => {
    const { authStore } = useStore();

    return (
        // 2. Wrap the application with ThemeProvider
        <ThemeProvider>
            <Navbar
                isAuthenticated={authStore.isAuthenticated}
                onLogout={() => authStore.logout()}
            />
            <AppRouter />
        </ThemeProvider>
    );
});