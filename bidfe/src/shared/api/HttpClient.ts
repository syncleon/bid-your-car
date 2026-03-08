const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export class ApiError extends Error {
    status: number;
    data?: unknown;

    constructor(status: number, message: string, data?: unknown) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = "ApiError";
    }
}

interface HttpOptions extends RequestInit {
    timeoutMs?: number;
}

function isRecord(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === "object" && obj !== null;
}

export async function http<T>(
    path: string,
    options: HttpOptions = {}
): Promise<T> {
    const {timeoutMs = 30000, ...fetchOptions} = options;

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${BASE_URL}${cleanPath}`;

    const headers = new Headers(fetchOptions.headers);

    if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: "include",
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get("Content-Type");
        const isJson = contentType?.includes("application/json");

        let body: unknown = null;

        if (response.status !== 204) {
            if (contentType?.includes("text/html")) {
                const text = await response.text();
                throw new ApiError(response.status, `Server returned HTML (Proxy/Gateway Error)`, text);
            }
            body = isJson ? await response.json() : await response.text();
        }

        if (!response.ok) {
            if (response.status === 429) {
                const retryAfter = response.headers.get("X-Rate-Limit-Retry-After-Seconds");

                let msg = `You are making requests too frequently. Please wait ${retryAfter || 'a few'} seconds.`;
                if (isRecord(body) && typeof body.error === "string") {
                    msg = body.error;
                }

                throw new ApiError(429, msg, body);
            }

            let errorMessage = "HTTP Error";
            if (isRecord(body)) {
                if (typeof body.message === "string") {
                    errorMessage = body.message;
                } else if (typeof body.error === "string") {
                    errorMessage = body.error;
                }
            } else if (typeof body === "string" && body.trim() !== "") {
                errorMessage = body;
            }

            throw new ApiError(response.status, errorMessage, body);
        }

        return body as T;

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiError(408, "Server timeout exceeded. Please check your internet connection.");
        }
        throw error;
    }
}