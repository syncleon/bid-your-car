import { makeAutoObservable } from "mobx";
import { login, register } from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";

export class AuthStore {
    token: string | null = tokenStorage.get();
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    get isAuthenticated() {
        return !!this.token;
    }

    async register(username: string, password: number, email: string) {
        this.isLoading = true;
        try {
            const { token } = await register({ username, password, email });
            this.setToken(token);
        } finally {
            this.isLoading = false;
        }
    }

    async login(username: string, password: number) {
        this.isLoading = true;
        try {
            const { token } = await login({ username, password });
            this.setToken(token);
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