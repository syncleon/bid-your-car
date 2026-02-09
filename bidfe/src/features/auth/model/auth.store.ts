import { makeAutoObservable, runInAction } from "mobx";
// Add verifyEmail to the imports
import { login, register, restoreAccount, verifyEmail } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type { LoginRequestDto, RegisterRequestDto } from "../types";

export type ModalView = 'login' | 'register' | null;

export interface AuthUser {
    id: number;
    username: string;
    roles: { name: string }[];
}

export class AuthStore {
    token: string | null = tokenStorage.get();
    user: AuthUser | null = null;

    // UI State
    modalView: ModalView = null;
    isLoading = false;
    error: string | null = null;
    successMessage: string | null = null;
    isDeletedAccount = false;

    constructor() {
        makeAutoObservable(this);
        if (this.token) {
            // Re-validate or decode token on load
            this.setToken(this.token);
        }
    }

    get isAuthenticated() {
        return Boolean(this.token);
    }

    // --- Modal Management ---
    openLogin = () => {
        this.reset();
        this.modalView = 'login';
    }

    openRegister = () => {
        this.reset();
        this.modalView = 'register';
    }

    closeModal = () => {
        this.reset();
        this.modalView = null;
    }

    reset() {
        this.error = null;
        this.successMessage = null;
        this.isLoading = false;
        this.isDeletedAccount = false;
    }

    // --- Helper Methods (Fixes for VerifyPage) ---

    clearError() {
        this.error = null;
    }

    clearSuccessMessage() {
        this.successMessage = null;
    }

    // --- Actions ---

    async login(data: LoginRequestDto) {
        this.isLoading = true;
        this.error = null;
        this.isDeletedAccount = false;

        try {
            const { token } = await login(data);
            runInAction(() => {
                this.setToken(token);
                this.closeModal();
            });
        } catch (e: any) {
            runInAction(() => {
                const msg = e.message || "An error occurred";
                this.error = msg;

                if (msg.toLowerCase().includes("account deleted")) {
                    this.isDeletedAccount = true;
                }
            });
            throw e;
        } finally {
            runInAction(() => this.isLoading = false);
        }
    }

    async register(data: RegisterRequestDto) {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;
        try {
            const message = await register(data);
            runInAction(() => {
                this.successMessage = message;
            });
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message;
            });
        } finally {
            runInAction(() => this.isLoading = false);
        }
    }

    // --- NEW: Verify Method ---
    async verify(token: string) {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;

        try {
            // You need to ensure verifyEmail is exported from ../api/auth.api
            const message = await verifyEmail(token);
            runInAction(() => {
                this.successMessage = message;
            });
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message || "Verification failed";
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async restore(data: LoginRequestDto) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await restoreAccount(data);
            runInAction(() => {
                this.successMessage = response.message;
            });
            await this.login(data);
        } catch (e: any) {
            runInAction(() => {
                this.error = e.message;
            });
        } finally {
            runInAction(() => this.isLoading = false);
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        tokenStorage.clear();
    }

    private setToken(token: string) {
        this.token = token;
        tokenStorage.set(token);
        this.decodeAndSetUser(token);
    }

    private decodeAndSetUser(token: string) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);

            let roles: { name: string }[] = [];
            if (Array.isArray(payload.roles)) {
                roles = payload.roles.map((r: any) => {
                    if (typeof r === 'string') return { name: r };
                    if (typeof r === 'object' && r.authority) return { name: r.authority };
                    if (typeof r === 'object' && r.name) return { name: r.name };
                    return { name: String(r) };
                });
            }

            this.user = {
                id: payload.userId,
                username: payload.sub,
                roles: roles
            };
        } catch (e) {
            console.error("Failed to decode token", e);
            this.user = null;
        }
    }
}