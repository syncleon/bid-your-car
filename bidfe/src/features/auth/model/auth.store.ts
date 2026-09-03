import { types, flow, type Instance } from "mobx-state-tree";
import {
    login as apiLogin,
    register as apiRegister,
    restoreAccount as apiRestoreAccount,
    verifyEmail as apiVerifyEmail,
    logoutUser as apiLogout
} from "../api/auth.api";
import { getProfile } from "../../profile/api/profile.api"; 
import { getErrorMessage } from "../../../shared/utils/error"; 
import type {
    LoginRequestDto,
    RegisterRequestDto,
    UserDto
} from "../types";

export const RoleModel = types.model("Role", {
    name: types.string,
});

export const AuthUserModel = types.model("AuthUser", {
    id: types.number,
    username: types.string,
    profilePhotoUrl: types.maybeNull(types.string),
    roles: types.array(RoleModel),
}).actions(self => ({
    setProfilePhotoUrl(url: string | null) {
        self.profilePhotoUrl = url;
    }
}));

export const AuthStore = types.model("AuthStore", {
    user: types.maybeNull(AuthUserModel),
    modalView: types.maybeNull(types.enumeration(["login", "register"])),
    isLoading: types.optional(types.boolean, false),
    isInitializing: types.optional(types.boolean, true),
    error: types.maybeNull(types.string),
    successMessage: types.maybeNull(types.string),
    isDeletedAccount: types.optional(types.boolean, false),
})
    .views((self) => ({
        get isAuthenticated() {
            return Boolean(self.user);
        }
    }))
    .actions((self) => {
        function reset() {
            self.error = null;
            self.successMessage = null;
            self.isLoading = false;
            self.isDeletedAccount = false;
        }

        const openLogin = () => { reset(); self.modalView = 'login'; };
        const openRegister = () => { reset(); self.modalView = 'register'; };
        const closeModal = () => { reset(); self.modalView = null; };
        const clearError = () => { self.error = null; };
        const clearSuccessMessage = () => { self.successMessage = null; };

        const checkAuth = flow(function* () {
            try {
                
                const userData: UserDto = yield getProfile();
                if (userData && userData.id) {
                    self.user = AuthUserModel.create({
                        id: userData.id,
                        username: userData.username,
                        profilePhotoUrl: userData.profilePhotoUrl || null,
                        roles: userData.roles
                    });
                } else {
                    self.user = null;
                }
            } catch {
                self.user = null;
            } finally {
                self.isInitializing = false;
            }
        });

        const afterCreate = () => {
            checkAuth();
        };

        const login = flow(function* (data: LoginRequestDto) {
            self.isLoading = true;
            self.error = null;
            self.isDeletedAccount = false;

            try {
                yield apiLogin(data);
                yield checkAuth();
                closeModal();
            } catch (error: unknown) {
                const msg = getErrorMessage(error);
                self.error = msg;

                if (msg.toLowerCase().includes("account deleted")) {
                    self.isDeletedAccount = true;
                }
                throw error;
            } finally {
                self.isLoading = false;
            }
        });

        const logout = flow(function* () {
            try {
                yield apiLogout();
            } catch(e) {
                console.error("Logout failed on server", e);
            } finally {
                self.user = null;
            }
        });

        const register = flow(function* (data: RegisterRequestDto) {
            self.isLoading = true;
            self.error = null;
            self.successMessage = null;

            try {
                const response = yield apiRegister(data);
                self.successMessage = response.message || response as string;
            } catch (error: unknown) {
                self.error = getErrorMessage(error);
            } finally {
                self.isLoading = false;
            }
        });

        const verify = flow(function* (token: string) {
            self.isLoading = true;
            self.error = null;
            self.successMessage = null;

            try {
                const response = yield apiVerifyEmail(token);
                self.successMessage = response.message || response as string;
            } catch (error: unknown) {
                self.error = getErrorMessage(error) || "Verification failed";
            } finally {
                self.isLoading = false;
            }
        });

        const restore = flow(function* (data: LoginRequestDto) {
            self.isLoading = true;
            self.error = null;

            try {
                const response = yield apiRestoreAccount(data);
                self.successMessage = response.message || "Account restored";
                yield login(data);
            } catch (error: unknown) {
                self.error = getErrorMessage(error);
            } finally {
                self.isLoading = false;
            }
        });

        return {
            reset, openLogin, openRegister, closeModal,
            clearError, clearSuccessMessage, checkAuth,
            logout, afterCreate, login, register, verify, restore
        };
    });

export type IAuthUser = Instance<typeof AuthUserModel>;
export type IAuthStore = Instance<typeof AuthStore>;