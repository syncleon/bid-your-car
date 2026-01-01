import type {LoginRequestDto, LoginResponseDto, RegisterRequestDto} from "../types.ts";

const BASE_URL = "http://localhost:8080/api/v1";

// Helper to handle both JSON and Text responses
async function request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let message = "Request failed";
        try {
            if (contentType?.includes("application/json")) {
                const body = await response.json();
                message = body.message || body.error || message;
            } else {
                message = await response.text();
            }
        } catch { /* empty */ }
        throw new Error(message);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
        return response.json();
    }
    return response.text() as unknown as T;
}

export const register = (dto: RegisterRequestDto) =>
    request<string>(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });

export const login = (dto: LoginRequestDto) =>
    request<LoginResponseDto>(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });

export const verifyEmail = (token: string) =>
    request<string>(`${BASE_URL}/verify?token=${token}`, {
        method: "GET",
    });