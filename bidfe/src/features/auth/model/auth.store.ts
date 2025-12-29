import { makeAutoObservable } from "mobx";
import { login, register } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";

export class AuthStore {
    token: string | null = tokenStorage.get();
    isLoading = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isAuthenticated() {
        return Boolean(this.token);
    }

    clearError() {
        this.error = null;
    }

    async register(username: string, password: string, email: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const { token } = await register({ username, password, email });
            this.setToken(token);
        } catch (e) {
            this.error = (e as Error).message;
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    async login(username: string, password: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const { token } = await login({ username, password });
            this.setToken(token);
        } catch (e) {
            this.error = (e as Error).message;
            throw e;
        } finally {
            this.isLoading = false;
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