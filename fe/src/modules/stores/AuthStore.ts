import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';

export interface RegisterData {
    username: string;
    password: string;
    email: string;
}

export interface AuthResponse {
    token: string;
}

class AuthStore {
    token: string | null = localStorage.getItem('token');
    isLoading = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    async register(registerData: RegisterData): Promise<boolean> {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.post<AuthResponse>(
                'http://localhost:8080/api/v1/register',
                registerData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            runInAction(() => {
                this.token = response.data.token;
                localStorage.setItem('token', response.data.token);
                this.isLoading = false;
            });

            return true;
        } catch (error: any) {
            runInAction(() => {
                this.isLoading = false;
                this.error = error.response?.data?.message || 'Registration failed';
            });
            return false;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    get isAuthenticated(): boolean {
        return !!this.token;
    }
}

export default new AuthStore();