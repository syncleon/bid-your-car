import type {
    LoginRequestDto,
    RegisterRequestDto,
    RestoreResponseDto
} from "../types";
import { http } from "../../../shared/api/HttpClient";

export const register = (dto: RegisterRequestDto) =>
    http<{ message: string } | string>("auth/register", {
        method: "POST",
        body: JSON.stringify(dto),
    });

export const login = (dto: LoginRequestDto) =>
    http<{ message: string }>("auth/login", {
        method: "POST",
        body: JSON.stringify(dto),
    });

// НОВЫЙ МЕТОД: Логаут (затирает HttpOnly куку на сервере)
export const logoutUser = () =>
    http<{ message: string }>("auth/logout", {
        method: "POST",
    });

// НОВЫЙ МЕТОД: Получение данных текущего пользователя по куке
export const fetchMe = () =>
    http<any>("auth/me", {
        method: "GET",
    });

export const verifyEmail = (token: string) =>
    http<{ message: string } | string>(`auth/verify?token=${token}`, {
        method: "GET"
    });

export const restoreAccount = (data: LoginRequestDto) =>
    http<RestoreResponseDto>("auth/restore", {
        method: "POST",
        body: JSON.stringify(data)
    });