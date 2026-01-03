import { tokenStorage } from "../lib/token";

const BASE_URL = "http://localhost:8080/api/v1"; // centralized base URL

export async function http<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = tokenStorage.get();

    const url = `${BASE_URL}${path}`;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // 1. Handle HTTP Errors
    if (!response.ok) {
        let errorMessage = "HTTP Error";
        try {
            // Try to parse error message from JSON response
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
            // Fallback if body is not JSON
            errorMessage = await response.text();
        }
        throw new Error(errorMessage);
    }

    // 2. Handle Empty Responses (common in DELETE/PUT)
    // If content-length is 0 or null, return null/void
    const contentLength = response.headers.get("Content-Length");
    if (contentLength === "0" || response.status === 204) {
        return null as T;
    }

    // 3. Return parsed JSON
    return response.json();
}