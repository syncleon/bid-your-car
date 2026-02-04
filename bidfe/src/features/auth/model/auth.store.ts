import { makeAutoObservable, runInAction } from "mobx";
import { login, register, restoreAccount, verifyEmail } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type { LoginRequestDto, RegisterRequestDto } from "../types";

// ✅ Define the User shape based on your JWT claims
export interface AuthUser {
    id: number;
    username: string;
}

export class AuthStore {
    token: string | null = tokenStorage.get();

    // ✅ ADD THIS: The property missing in your error
    user: AuthUser | null = null;

    isLoading = false;
    error: string | null = null;
    successMessage: string | null = null;
    isDeletedAccount = false;

    constructor() {
        makeAutoObservable(this);
        // ✅ Initialize user from stored token on app load
        if (this.token) {
            this.decodeAndSetUser(this.token);
        }
    }

    get isAuthenticated() {
        return Boolean(this.token);
    }

    reset() {
        this.error = null;
        this.successMessage = null;
        this.isLoading = false;
        this.isDeletedAccount = false;
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
        } catch (e) {
            runInAction(() => {
                this.error = (e as Error).message;
            });
            throw e;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async verify(token: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const message = await verifyEmail(token);
            runInAction(() => {
                this.successMessage = message;
            });
        } catch (e) {
            runInAction(() => {
                this.error = (e as Error).message;
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async login(data: LoginRequestDto) {
        this.isLoading = true;
        this.error = null;
        this.isDeletedAccount = false;

        try {
            const { token } = await login(data);
            runInAction(() => {
                this.setToken(token);
            });
        } catch (e) {
            runInAction(() => {
                const msg = (e as Error).message;
                this.error = msg;
                if (msg.toLowerCase().includes("deleted")) {
                    this.isDeletedAccount = true;
                }
            });
            throw e;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async restore(data: LoginRequestDto) {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;

        try {
            const response = await restoreAccount(data);

            runInAction(() => {
                this.successMessage = response.message;
            });

            await this.login(data);

            runInAction(() => {
                this.isDeletedAccount = false;
            });
        } catch (e) {
            runInAction(() => {
                this.error = (e as Error).message;
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    logout() {
        this.token = null;
        this.user = null; // ✅ Clear user on logout
        tokenStorage.clear();
    }

    private setToken(token: string) {
        this.token = token;
        tokenStorage.set(token);
        // ✅ Decode immediately when setting token
        this.decodeAndSetUser(token);
    }

    // ✅ Helper to parse JWT without external libraries
    private decodeAndSetUser(token: string) {
        try {
            // Split header.payload.signature
            const base64Url = token.split('.')[1];
            // Fix Base64Url to Base64
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            // Decode
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);

            // Map backend claims to frontend User object
            // Backend sends: { sub: "username", userId: 123, ... }
            this.user = {
                id: payload.userId,
                username: payload.sub
            };
        } catch (e) {
            console.error("Failed to decode token", e);
            this.user = null;
            // If token is corrupt, clear it
            this.logout();
        }
    }
}