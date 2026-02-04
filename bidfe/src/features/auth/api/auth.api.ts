import type {
    LoginRequestDto,
    AuthResponseDto,
    RegisterRequestDto,
    RestoreResponseDto
} from "../types";

const BASE_URL = "http://localhost:8080/api/v1";

/**
 * Generic request wrapper.
 * Handles the new GlobalExceptionHandler format: { error: "Message", timestamp: 123 }
 */
async function request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    // Handle Errors
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;

        try {
            if (contentType?.includes("application/json")) {
                const body = await response.json();
                // 1. Check for standard "error" field from GlobalExceptionHandler
                if (body.error) {
                    errorMessage = body.error;
                }
                // 2. Check for Validation errors
                else if (body.details) {
                    // specific field errors exist, but we flatten to a string for simple display
                    errorMessage = Object.values(body.details).join(", ");
                }
                // 3. Fallback
                else if (body.message) {
                    errorMessage = body.message;
                }
            } else {
                // Handle plain text errors (rare in your new setup, but safe to keep)
                const text = await response.text();
                if (text) errorMessage = text;
            }
        } catch (e) {
            // parsing failed, use default message
        }

        throw new Error(errorMessage);
    }

    // Handle Success
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }

    // Handle plain text responses (e.g., Register/Verify endpoints return strings)
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