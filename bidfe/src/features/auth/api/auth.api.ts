import type { LoginRequestDto, LoginResponseDto, RegisterRequestDto } from "../types.ts";

const BASE_URL = "http://localhost:8080/api/v1";

/**
 * A robust fetch wrapper that handles response parsing for both JSON and plain text.
 * Uses response cloning to allow error message extraction without locking the
 * primary response stream.
 *
 * @param url The full endpoint URL.
 * @param options Fetch configuration including method, headers, and body.
 * @returns Parsed response data of type T.
 * @throws Error with a message extracted from the response body.
 */
async function request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorClone = response.clone();
        const contentType = errorClone.headers.get("content-type");
        let message = "Request failed";

        try {
            if (contentType?.includes("application/json")) {
                const body = await errorClone.json();
                message = body.message || body.error || message;
            } else {
                message = await errorClone.text();
            }
        } catch {
            message = response.statusText || message;
        }
        throw new Error(message);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
        return response.json();
    }

    return response.text() as unknown as T;
}

/**
 * Registers a new user account.
 * @param dto User registration details.
 * @returns Success confirmation message.
 */
export const register = (dto: RegisterRequestDto) =>
    request<string>(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });

/**
 * Authenticates a user and retrieves a session token.
 * @param dto Login credentials.
 * @returns Session data including JWT.
 */
export const login = (dto: LoginRequestDto) =>
    request<LoginResponseDto>(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });

/**
 * Verifies an account via an email token.
 * @param token The unique verification token.
 */
export const verifyEmail = (token: string) =>
    request<string>(`${BASE_URL}/verify?token=${token}`, {
        method: "GET",
    });

interface RestoreResponse {
    message: string;
}

/**
 * Reactivates a soft-deleted account.
 * @param data User credentials for validation.
 */
export const restoreAccount = (data: LoginRequestDto) =>
    request<RestoreResponse>(`${BASE_URL}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });