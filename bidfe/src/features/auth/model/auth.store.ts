import { makeAutoObservable } from "mobx";
import { login, register, verifyEmail } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type { LoginRequestDto, RegisterRequestDto } from "../types";

export class AuthStore {
    token: string | null = tokenStorage.get();
    isLoading = false;
    error: string | null = null;
    successMessage: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isAuthenticated() {
        return Boolean(this.token);
    }

    clearError() {
        this.error = null;
    }

    clearSuccessMessage() {
        this.successMessage = null;
    }

    // Fix: Explicitly type the argument as RegisterRequestDto
    async register(data: RegisterRequestDto) {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;
        try {
            const message = await register(data);
            this.successMessage = message;
        } catch (e) {
            this.error = (e as Error).message;
            throw e;
        } finally {
            this.isLoading = false;
        }
    }

    // NEW: Verify action
    async verify(token: string) {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;
        try {
            const message = await verifyEmail(token);
            this.successMessage = message;
        } catch (e) {
            this.error = (e as Error).message;
        } finally {
            this.isLoading = false;
        }
    }

    // Fix: Explicitly type the argument as LoginRequestDto
    async login(data: LoginRequestDto) {
        this.isLoading = true;
        this.error = null;
        try {
            // Now 'data' is guaranteed to be { username, password }
            const { token } = await login(data);
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