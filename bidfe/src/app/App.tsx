import { observer } from "mobx-react-lite";
import { Navbar } from "../widgets/Navbar/Navbar";
import { useStore } from "../shared/hooks/useStore";
import { AppRouter } from "./router";
import { ThemeProvider } from "./providers/ThemeProvider";

export const App = observer(() => {
    const { authStore } = useStore();

    return (
        <ThemeProvider>
            <Navbar
                isAuthenticated={authStore.isAuthenticated}
                onLogout={() => authStore.logout()}
            />
            <AppRouter />
        </ThemeProvider>
    );
});