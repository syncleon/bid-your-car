export interface RegisterRequestDto {
    username: string;
    password: string;
    email: string;
}

export interface LoginRequestDto {
    username: string;
    password: string;
}

// Matches AuthRespDto from backend
export interface AuthResponseDto {
    token: string;
}

export interface RoleDto {
    name: string;
}

export interface UserDto {
    id: number;
    username: string;
    email: string;
    roles: RoleDto[];
}

// Matches GlobalExceptionHandler response
export interface ApiErrorResponse {
    error: string;
    timestamp: number;
    details?: Record<string, string>; // For validation errors
}

export interface RestoreResponseDto {
    message: string;
}