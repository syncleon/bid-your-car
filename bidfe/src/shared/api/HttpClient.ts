import { tokenStorage } from "../lib/token";

// Убедитесь, что ссылка совпадает с той, что выдал lt (без пробелов)
const BASE_URL = "https://green-mangos-crash.loca.lt/api/v1";

export async function http<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = tokenStorage.get();

    // Исправление двойных слешей
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${BASE_URL}${cleanPath}`;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        // ------------------------------------------

        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // ... остальной код (обработка JSON/Text) ...
    const contentType = response.headers.get("Content-Type");
    const isJson = contentType?.includes("application/json");

    let body: any = null;
    if (response.status !== 204) {
        // Дополнительная проверка: если пришел HTML, значит туннель вернул ошибку
        if (contentType?.includes("text/html")) {
            console.error("Received HTML response from Tunnel:", await response.text());
            throw new Error("Tunnel Error: Received HTML instead of JSON.");
        }
        body = isJson ? await response.json() : await response.text();
    }

    if (!response.ok) {
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