import { http } from "../../../shared/api/HttpClient";
import type { Profile } from "../types";

export const getProfile = () =>
    http<Profile>("/users/me", { method: "GET" });

export const updateProfile = (data: { username: string; email: string }) =>
    http<Profile>("/users/me/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
    http<void>("/users/me/change-password", {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const deleteUserById = (userId: number, password: string) =>
    http<void>(`/users/${userId}`, {
        method: "DELETE",
        body: JSON.stringify({ password }),
    });