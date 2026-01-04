import { http } from "../../../shared/api/HttpClient";
import type { Profile } from "../types";

/**
 * Fetches the authenticated user's profile data.
 * @returns The current user's profile information.
 */
export const getProfile = () =>
    http<Profile>("/users/me", { method: "GET" });

/**
 * Updates general profile information.
 * @param data New username and email address.
 * @returns The updated profile.
 */
export const updateProfile = (data: { username: string; email: string }) =>
    http<Profile>("/users/me/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });

/**
 * Updates the user's password.
 * @param data Current password and the new replacement password.
 */
export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
    http<void>("/users/me/change-password", {
        method: "PUT",
        body: JSON.stringify(data),
    });

/**
 * Initiates a soft-delete of the user's account.
 * @param userId The ID of the user to delete.
 * @param password The user's password to authorize the action.
 */
export const deleteUserById = (userId: number, password: string) =>
    http<void>(`/users/${userId}`, {
        method: "DELETE",
        body: JSON.stringify({ password }),
    });