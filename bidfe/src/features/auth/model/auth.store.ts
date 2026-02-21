import { types, flow, type Instance } from "mobx-state-tree";
import {
    login as apiLogin,
    register as apiRegister,
    restoreAccount as apiRestoreAccount,
    verifyEmail as apiVerifyEmail,
    fetchMe as apiFetchMe, // Импортируем новый метод для профиля
    logoutUser as apiLogout // Импортируем новый метод логаута
} from "../api/auth.api";
import type {
    LoginRequestDto,
    RegisterRequestDto
} from "../types";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

export const RoleModel = types.model("Role", {
    name: types.string,
});

export const AuthUserModel = types.model("AuthUser", {
    id: types.number,
    username: types.string,
    roles: types.array(RoleModel),
});

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
                const userData = yield apiFetchMe();
                self.user = AuthUserModel.create(userData);
            } catch (error) {
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
                self.successMessage = response.message || response;
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
                self.successMessage = response.message || response;
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
            reset,
            openLogin,
            openRegister,
            closeModal,
            clearError,
            clearSuccessMessage,
            checkAuth,
            logout,
            afterCreate,
            login,
            register,
            verify,
            restore
        };
    });

export type IAuthUser = Instance<typeof AuthUserModel>;
export type IAuthStore = Instance<typeof AuthStore>;