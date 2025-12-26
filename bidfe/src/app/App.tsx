import { observer } from "mobx-react-lite";
import { Navbar } from "../widgets/Navbar/Navbar";
import { useStore } from "../shared/hooks/useStore";
import { AppRouter } from "./router";

export const App = observer(() => {
    const { authStore } = useStore();

    return (
        <>
            <Navbar
                isAuthenticated={authStore.isAuthenticated}
                onLogout={() => authStore.logout()}
            />
            <AppRouter />
        </>
    );
});