import type {
    LoginRequestDto,
    AuthResponseDto,
    RegisterRequestDto,
    RestoreResponseDto
} from "../types";

// Убедитесь, что ссылка свежая!
const BASE_URL = "https://green-mangos-crash.loca.lt/api/v1";

async function request<T>(url: string, options: RequestInit): Promise<T> {
    // --- ДОБАВЛЯЕМ ЗАГОЛОВОК СЮДА ---
    const headers = {
        "Bypass-Tunnel-Reminder": "true",
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    // --------------------------------

    if (!response.ok) {
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            try {
                const body = await response.json();
                if (body.message) errorMessage = body.message;
                else if (body.error) errorMessage = body.error;
            } catch (e) {}
        }
        // Если пришел HTML от туннеля (ошибка)
        if (contentType?.includes("text/html")) {
            throw new Error("Tunnel Error: Received HTML instead of JSON. Check headers.");
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return response.text() as unknown as T;
}

// Остальные функции (register, login...) остаются без изменений,
// так как они используют исправленный `request`.
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