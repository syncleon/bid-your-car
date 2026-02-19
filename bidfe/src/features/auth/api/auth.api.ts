import type {
    LoginRequestDto,
    AuthResponseDto,
    RegisterRequestDto,
    RestoreResponseDto
} from "../types";
import { http } from "../../../shared/api/HttpClient.ts";

export const register = (dto: RegisterRequestDto) =>
    http<string>("auth/register", {
        method: "POST",
        body: JSON.stringify(dto),
    });

export const login = (dto: LoginRequestDto) =>
    http<AuthResponseDto>("auth/login", {
        method: "POST",
        body: JSON.stringify(dto),
    });

export const verifyEmail = (token: string) =>
    http<string>(`auth/verify?token=${token}`, {
        method: "GET"
    });

export const restoreAccount = (data: LoginRequestDto) =>
    http<RestoreResponseDto>("auth/restore", {
        method: "POST",
        body: JSON.stringify(data)
    });
