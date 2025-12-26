import type { ReactNode } from "react";
import { StoreContext } from "./StoreContext";
import type { RootStore } from "../stores/RootStore";

interface Props {
    store: RootStore;
    children: ReactNode;
}

export const StoreProvider = ({ store, children }: Props) => {
    return (
        <StoreContext.Provider value={store}>
            {children}
        </StoreContext.Provider>
    );
};