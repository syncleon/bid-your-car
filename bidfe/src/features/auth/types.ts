export interface LoginRequestDto {
    username: string;
    password: string;
}

export interface RegisterRequestDto {
    username: string;
    password: string;
    email: string;
}

export interface DeleteAccountRequestDto {
    password: string;
}

export interface UpdateUserRequestDto {
    username?: string;
    email?: string;
    password?: string;
}

export interface UpdateProfileRequestDto {
    username?: string;
    email?: string;
}

export interface UpdatePasswordRequestDto {
    oldPassword: string;
    newPassword: string;
}

export interface UserBatchRequestDto {
    userIds: number[];
}

export interface AuthResponseDto {
    token: string;
    type: string; // Usually "Bearer"
}

export interface RoleDto {
    name: string; // Matches the RoleModel in AuthStore
}

export interface UserDto {
    id: number;
    username: string;
    email: string;
    roles: RoleDto[];
    createdDate?: string; // ISO Instant string
}

/**
 * Standardized Error Response
 * Matches the GlobalExceptionHandler in your Spring Boot backend
 */
export interface ApiErrorResponse {
    message?: string; // Often used by Spring Default
    error: string;
    timestamp: number;
    details?: Record<string, string>; // For validation errors (e.g., "email": "invalid format")
}

export interface RestoreResponseDto {
    message: string;
}