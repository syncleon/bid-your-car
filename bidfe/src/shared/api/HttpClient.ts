import { tokenStorage } from "../lib/token";

export async function http<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = tokenStorage.get();

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error("HTTP error");
    }

    return response.json();
}