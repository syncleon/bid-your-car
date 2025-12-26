import type {AuthResponse, LoginRequest, RegisterRequest} from "../types";

const BASE_URL = "http://localhost:8080/api/v1";

async function request<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error("Auth request failed");
    }

    return response.json();
}

export const register = (data: RegisterRequest) =>
    request<AuthResponse>(`${BASE_URL}/register`, data);

export const login = (data: LoginRequest) =>
    request<AuthResponse>(`${BASE_URL}/login`, data);