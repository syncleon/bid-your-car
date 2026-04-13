import type { ItemDto } from "../../item/types";
import type { Page } from "../../../shared/types";
import { http } from "../../../shared/api/HttpClient";
import type {
    DeleteAccountRequestDto,
    UpdatePasswordRequestDto,
    UpdateProfileRequestDto,
    UserDto
} from "../../auth/types";

export const getProfile = () =>
    http<UserDto>("/users/me", {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

export const updateProfile = (data: UpdateProfileRequestDto) =>
    http<UserDto>(
        "/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
    });

export const changePassword = (data: UpdatePasswordRequestDto) =>
    http<void>(
        "/users/me/password", {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const deleteMyAccount = (data: DeleteAccountRequestDto) =>
    http<void>(
        `/users/me`, {
        method: "DELETE",
        body: JSON.stringify(data),
    });

export const getUserItems = () =>
    http<Page<ItemDto>>(
        "/users/me/items", {
        method: "GET"
    });