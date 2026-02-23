import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../widgets/Navbar/Navbar";
import { useStore } from "../shared/hooks/useStore";
import { AppRouter } from "./router";
import { ThemeProvider } from "./providers/ThemeProvider";

export const App = observer(() => {
    const { authStore } = useStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authStore.logout();
        navigate("/");
    };

    return (
        <ThemeProvider>
            <Navbar
                isAuthenticated={authStore.isAuthenticated}
                onLogout={handleLogout}
            />
            <AppRouter />
        </ThemeProvider>
    );
});