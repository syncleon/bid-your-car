import { types, flow, getRoot, type Instance } from "mobx-state-tree";
import {
    getProfile,
    deleteMyAccount, // <-- ИСПРАВЛЕНО: импортируем новый метод
    updateProfile,
    changePassword,
} from "../api/profile.api";
import type {
    DeleteAccountRequestDto,
    UpdatePasswordRequestDto,
    UpdateProfileRequestDto,
    UserDto
} from "../../auth/types";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

interface IRootStoreShape {
    authStore?: {
        logout: () => void;
    };
}

export const UserRoleModel = types.model("UserRole", {
    name: types.string,
});

export const UserProfileModel = types.model("UserProfile", {
    id: types.number,
    username: types.string,
    email: types.string,
    roles: types.array(UserRoleModel),
    createdDate: types.maybeNull(types.string),
})
    .views((self) => ({
        get formattedCreatedDate() {
            if (!self.createdDate) return "N/A";
            return new Date(self.createdDate).toLocaleDateString();
        }
    }));

export const ProfileStore = types.model("ProfileStore", {
    profile: types.maybeNull(UserProfileModel),
    isLoading: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
    successMessage: types.maybeNull(types.string),
})
    .actions((self) => {
        const clearMessages = () => {
            self.error = null;
            self.successMessage = null;
        };

        const loadProfile = flow(function* () {
            self.isLoading = true;
            try {
                const data = (yield getProfile()) as UserDto;
                self.profile = UserProfileModel.create({
                    ...data,
                    createdDate: data.createdDate || null
                });
            } catch (error: unknown) {
                console.debug("Profile load failed (expected if unauthorized):", error);
            } finally {
                self.isLoading = false;
            }
        });

        const updateProfileData = flow(function* (data: UpdateProfileRequestDto) {
            self.isLoading = true;
            clearMessages();
            try {
                const updated = (yield updateProfile(data)) as UserDto;
                self.profile = UserProfileModel.create({
                    ...updated,
                    createdDate: updated.createdDate || null
                });
                self.successMessage = "Profile updated successfully!";
            } catch (error: unknown) {
                self.error = getErrorMessage(error);
                throw error; // Re-throw so the form can handle local UI state if needed
            } finally {
                self.isLoading = false;
            }
        });

        const changeUserPassword = flow(function* (data: UpdatePasswordRequestDto) {
            self.isLoading = true;
            clearMessages();
            try {
                yield changePassword(data);
                self.successMessage = "Password changed successfully!";
            } catch (error: unknown) {
                self.error = getErrorMessage(error);
                throw error;
            } finally {
                self.isLoading = false;
            }
        });

        const deleteAccount = flow(function* (data: DeleteAccountRequestDto) {
            if (!self.profile?.id) return;

            self.isLoading = true;
            try {
                // ИСПРАВЛЕНО: Вызываем deleteMyAccount и передаем только data (пароль)
                yield deleteMyAccount(data);
                self.profile = null;

                // Type-safe access to the root store to trigger logout
                const root = getRoot<IRootStoreShape>(self);
                if (root?.authStore?.logout) {
                    root.authStore.logout();
                }
            } catch (error: unknown) {
                self.error = getErrorMessage(error);
                throw error;
            } finally {
                self.isLoading = false;
            }
        });

        return {
            clearMessages,
            loadProfile,
            updateProfileData,
            changeUserPassword,
            deleteAccount
        };
    });

export type IUserProfile = Instance<typeof UserProfileModel>;
export type IProfileStore = Instance<typeof ProfileStore>;