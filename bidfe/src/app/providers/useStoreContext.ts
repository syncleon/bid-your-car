import { useContext } from "react";
import { StoreContext } from "./StoreContext";

export const useStoreContext = () => {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error("StoreProvider is missing");
    }
    return store;
};