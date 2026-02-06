import { makeAutoObservable, runInAction } from "mobx";
import { login, register, restoreAccount } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type {LoginRequestDto, RegisterRequestDto} from "../types.ts";

export type ModalView = 'login' | 'register' | null;

class AuthUser {
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
            const { token } = await login(data);
            runInAction(() => {
                this.setToken(token);
                this.closeModal(); // Close modal on success
            });
        } catch (e: any) {
            runInAction(() => {
                const msg = e.message || "An error occurred";
                this.error = msg;

                // Check specifically for the text returned by backend
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
            this.user = { id: payload.userId, username: payload.sub };
        } catch (e) {
            this.user = null;
            this.logout();
        }
    }
}