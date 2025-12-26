import { useStoreContext } from "../../app/providers/useStoreContext";

export const useStore = () => {
    return useStoreContext();
};