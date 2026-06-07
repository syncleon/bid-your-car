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
export interface UpdateProfileRequestDto {
    username?: string;
    email?: string;
}

export interface UpdatePasswordRequestDto {
    oldPassword: string;
    newPassword: string;
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
export interface RestoreResponseDto {
    message: string;
}