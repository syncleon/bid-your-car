import { makeAutoObservable } from "mobx";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

export class ToastStore {
    toasts: ToastMessage[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    addToast(message: string, type: ToastType = "info", duration: number = 3000) {
        const id = Math.random().toString(36).substring(2, 9);
        this.toasts.push({ id, message, type, duration });

        if (duration > 0) {
            setTimeout(() => this.removeToast(id), duration);
        }
    }

    removeToast(id: string) {
        this.toasts = this.toasts.filter(toast => toast.id !== id);
    }
}
