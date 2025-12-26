import { createContext } from "react";
import { RootStore } from "../stores/RootStore";

export const StoreContext = createContext<RootStore | null>(null);