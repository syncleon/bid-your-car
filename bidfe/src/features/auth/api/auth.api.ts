import type { LoginRequestDto, LoginResponseDto, RegisterRequestDto } from "../types.ts";

const BASE_URL = "http://localhost:8080/api/v1";

/**
 * A generalized fetch wrapper that handles response parsing for both
 * JSON and plain text, while providing robust error extraction.
 * * @param url The full endpoint URL.
 * @param url
 * @param options Fetch configuration including method, headers, and body.
 * @returns Parsed response data of type T.
 * @throws Error with a message extracted from the response body or status text.
 */
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

/**
 * Sends a request to register a new user account.
 * * @param dto User registration details.
 * @returns A success message as a string.
 */
export const register = (dto: RegisterRequestDto) =>
    request<string>(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });

/**
 * Authenticates a user with the server.
 * * @param dto Login credentials.
 * @returns A response object containing the JWT token and user metadata.
 */
export const login = (dto: LoginRequestDto) =>
    request<LoginResponseDto>(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });

/**
 * Validates a user's email address using a token.
 * * @param token The verification token provided in the email link.
 * @returns A success message as a string.
 */
export const verifyEmail = (token: string) =>
    request<string>(`${BASE_URL}/verify?token=${token}`, {
        method: "GET",
    });

/**
 * Response structure for the account restoration endpoint.
 */
interface RestoreResponse {
    message: string;
}

/**
 * Requests the restoration of a soft-deleted account.
 * * @param data User credentials for identity verification.
 * @returns A confirmation message object.
 */
export const restoreAccount = (data: LoginRequestDto) =>
    request<RestoreResponse>(`${BASE_URL}/restore`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    });