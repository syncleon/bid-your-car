export interface RegisterRequest {
    username: string;
    password: number;
    email: string;
}

export interface LoginRequest {
    username: string;
    password: number;
}

export interface AuthResponse {
    token: string;
}