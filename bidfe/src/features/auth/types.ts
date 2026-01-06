export interface RegisterRequestDto {
    username: string;
    password: string;
    email: string;
}

export interface LoginRequestDto {
    username: string;
    password: string;
}

export interface LoginResponseDto {
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