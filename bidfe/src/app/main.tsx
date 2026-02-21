import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { RootStore } from "./stores/RootStore";
import { StoreProvider } from "./providers/StoreProvider";

const rootStore = new RootStore();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <StoreProvider store={rootStore}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </StoreProvider>
    </React.StrictMode>
);