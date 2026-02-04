import { makeAutoObservable, runInAction } from "mobx";
import { login, register, restoreAccount, verifyEmail } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type { LoginRequestDto, RegisterRequestDto } from "../types";

export class AuthStore {
    token: string | null = tokenStorage.get();
    isLoading = false;
    error: string | null = null;
    successMessage: string | null = null;
    isDeletedAccount = false;

    constructor() {
        makeAutoObservable(this);
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
            // Backend returns a raw string message for registration
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
                // Backend AuthService throws UnauthorizedException with "deleted" in text
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
            // Backend returns JSON: { "message": "..." }
            const response = await restoreAccount(data);

            runInAction(() => {
                this.successMessage = response.message;
            });

            // Automatically login after restore
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
        tokenStorage.clear();
    }

    private setToken(token: string) {
        this.token = token;
        tokenStorage.set(token);
    }
}