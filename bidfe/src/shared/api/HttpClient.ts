import { tokenStorage } from "../lib/token";

const BASE_URL = "http://localhost:8080/api/v1";

/**
 * A centralized HTTP utility for making authenticated API requests.
 * Standardizes the consumption of the response body to prevent
 * "stream already read" errors by reading the body exactly once.
 */
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

    // Determine if there is actually a body to read
    const contentType = response.headers.get("Content-Type");
    const isJson = contentType?.includes("application/json");

    // READ THE BODY ONCE
    let body: any = null;
    if (response.status !== 204) {
        body = isJson ? await response.json() : await response.text();
    }

    if (!response.ok) {
        // Since we already read the body, we just extract the message
        let errorMessage = "HTTP Error";
        if (isJson && typeof body === 'object') {
            errorMessage = body.message || body.error || errorMessage;
        } else if (typeof body === 'string' && body.length > 0) {
            errorMessage = body;
        }
        throw new Error(errorMessage);
    }

    return body as T;
}