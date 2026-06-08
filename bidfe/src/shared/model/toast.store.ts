import { types, flow, type Instance } from "mobx-state-tree";

export const ToastModel = types.model("Toast", {
    id: types.identifier,
    message: types.string,
    type: types.enumeration(["success", "error", "warning", "info"]),
});

export const ToastStore = types.model("ToastStore", {
    toasts: types.array(ToastModel),
})
.actions((self) => {
    function removeToast(id: string) {
        const toast = self.toasts.find((t) => t.id === id);
        if (toast) {
            self.toasts.remove(toast);
        }
    }

    const addToast = flow(function* (message: string, type: "success" | "error" | "warning" | "info" = "info", durationMs = 3000) {
        const id = Math.random().toString(36).substring(2, 9);
        self.toasts.push({ id, message, type });
        
        yield new Promise((resolve) => setTimeout(resolve, durationMs));
        removeToast(id);
    });

    return {
        addToast,
        removeToast,
    };
});

export type IToastStore = Instance<typeof ToastStore>;
export type IToast = Instance<typeof ToastModel>;
