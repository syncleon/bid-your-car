import type {
    LoginRequestDto,
    AuthResponseDto,
    RegisterRequestDto,
    RestoreResponseDto
} from "../types";

const BASE_URL = "http://localhost:8080/api/v1";

/**
 * Generic request wrapper.
 * Properly parses the Spring Boot error structure:
 * { status: 401, error: "Unauthorized", message: "Account deleted...", ... }
 */
async function request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    // Handle Errors
    if (!response.ok) {
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;

        // Attempt to parse JSON error body
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            try {
                const body = await response.json();
                // Prioritize 'message' because that's where your custom exception message lives
                if (body.message) {
                    errorMessage = body.message;
                } else if (body.error) {
                    errorMessage = body.error;
                }
            } catch (e) {
                // JSON parse failed, stick to statusText
            }
        }

        // Create an error object that preserves the status for checking later if needed
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }

    // Handle Success
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
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
    request<AuthResponseDto>(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });

export const verifyEmail = (token: string) =>
    request<string>(`${BASE_URL}/verify?token=${token}`, {
        method: "GET",
    });

export const restoreAccount = (data: LoginRequestDto) =>
    request<RestoreResponseDto>(`${BASE_URL}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });