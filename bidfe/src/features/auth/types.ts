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
    type: string;
}

export interface RoleDto {
    name: string;
}

export interface UserDto {
    id: number;
    username: string;
    email: string;
    roles: RoleDto[];
    createdDate?: string;
}

export interface ApiErrorResponse {
    message?: string;
    error: string;
    timestamp: number;
    details?: Record<string, string>;
}

export interface RestoreResponseDto {
    message: string;
}