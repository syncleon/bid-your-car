import type {
    LoginRequestDto,
    RegisterRequestDto,
    LoginResponseDto,
} from "../types";

const BASE_URL = "http://localhost:8080/api/v1";

async function post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        let message = "Request failed";

        const contentType = response.headers.get("content-type");

        try {
            if (contentType?.includes("application/json")) {
                const errorBody = await response.json();
                message =
                    errorBody?.message ||
                    errorBody?.error ||
                    message;
            } else {
                // ✅ THIS is your case
                message = await response.text();
            }
        } catch {
            // ignore parsing errors
        }

        throw new Error(message);
    }

    return response.json();
}

export const register = (dto: RegisterRequestDto) =>
    post<LoginResponseDto>(`${BASE_URL}/register`, dto);

export const login = (dto: LoginRequestDto) =>
    post<LoginResponseDto>(`${BASE_URL}/login`, dto);