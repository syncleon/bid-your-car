import { makeAutoObservable, runInAction } from "mobx";
import { login, register, restoreAccount, verifyEmail } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type { LoginRequestDto, RegisterRequestDto } from "../types";

/**
 * Manages the authentication state and operations for the application.
 * Handles user sessions, registration, account verification,
 * and account restoration logic.
 */
export class AuthStore {
    token: string | null = tokenStorage.get();
    isLoading = false;
    error: string | null = null;
    successMessage: string | null = null;
    isDeletedAccount = false;

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Computed property indicating whether a user session is active.
     */
    get isAuthenticated() {
        return Boolean(this.token);
    }

    /**
     * Clears the current error state.
     */
    clearError() {
        this.error = null;
    }

    /**
     * Clears the current success message state.
     */
    clearSuccessMessage() {
        this.successMessage = null;
    }

    /**
     * Registers a new user account.
     * * @param data The registration details including username, email, and password.
     * @throws Re-throws the error after updating the state for component-level handling.
     */
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

    /**
     * Verifies a user account via a secure email token.
     * * @param token The verification token extracted from the URL.
     */
    async verify(token: string) {
        this.isLoading = true;
        this.error = null;
        this.successMessage = null;
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

    /**
     * Authenticates a user and establishes a session.
     * Identifies if an account is in a soft-deleted state based on server response.
     * * @param data User credentials.
     * @throws Re-throws the error for component-level handling.
     */
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

    /**
     * Reactivates a soft-deleted account and performs an automatic login.
     * * @param data User credentials for the account to be restored.
     */
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

    /**
     * Destroys the current user session and clears persisted tokens.
     */
    logout() {
        this.token = null;
        tokenStorage.clear();
    }

    /**
     * Persists the JWT token to local storage and updates internal state.
     * * @param token The JWT token provided by the server.
     */
    private setToken(token: string) {
        this.token = token;
        tokenStorage.set(token);
    }

    /**
     * Resets all transient UI states (errors, messages, loaders).
     */
    reset() {
        this.error = null;
        this.successMessage = null;
        this.isLoading = false;
        this.isDeletedAccount = false;
    }
}