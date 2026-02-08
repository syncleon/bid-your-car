import { makeAutoObservable, runInAction } from "mobx";
import { login, register, restoreAccount } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type { LoginRequestDto, RegisterRequestDto } from "../types";

export type ModalView = 'login' | 'register' | null;

// 1. Define the User shape explicitly
export interface AuthUser {
    id: number;
    username: string;
    roles: { name: string }[]; // Matches: user?.roles.some(r => r.name === 'ADMIN')
}

export class AuthStore {
    token: string | null = tokenStorage.get();

    // 2. Apply the interface here
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
            this.decodeAndSetUser(this.token);
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

    // --- Actions ---

    async login(data: LoginRequestDto) {
        this.isLoading = true;
        this.error = null;
        this.isDeletedAccount = false;

        try {
            const { token } = await login(data); // returns { token: string }
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

    async restore(data: LoginRequestDto) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await restoreAccount(data);
            runInAction(() => {
                this.successMessage = response.message;
            });
            // Auto-login after restore
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

            // 3. Robust Role Parsing
            // Handles cases where roles might be strings ["ADMIN"] or objects [{authority:"ADMIN"}]
            let roles = [];
            if (Array.isArray(payload.roles)) {
                roles = payload.roles.map((r: any) => {
                    if (typeof r === 'string') return { name: r };
                    if (typeof r === 'object' && r.authority) return { name: r.authority };
                    return r; // Assume it's already { name: '...' }
                });
            }

            this.user = {
                id: payload.userId, // Ensure your JWT claim is named 'userId'
                username: payload.sub,
                roles: roles
            };
        } catch (e) {
            console.error("Failed to decode token", e);
            this.user = null;
            this.logout();
        }
    }
}