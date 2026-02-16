import type { ItemDto } from "../../item/types";
import type { Page } from "../../../shared/types";
import {http} from "../../../shared/api/HttpClient.ts";
import type {
    DeleteAccountRequestDto,
    UpdatePasswordRequestDto,
    UpdateProfileRequestDto,
    UserDto
} from "../../auth/types.ts";

export const getProfile = () =>
    http<UserDto>("/users/me", {
        method: "GET"
    });

export const updateProfile = (data: UpdateProfileRequestDto) =>
    http<UserDto>("/users/me/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const changePassword = (data: UpdatePasswordRequestDto) =>
    http<void>("/users/me/change-password", {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const deleteUserById = (userId: number, data: DeleteAccountRequestDto) =>
    http<void>(`/users/${userId}`, {
        method: "DELETE",
        body: JSON.stringify(data),
    });

export const getUserItems = () =>
    http<Page<ItemDto>>("/users/me/items", {
        method: "GET"
    });