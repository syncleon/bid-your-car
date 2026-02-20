import { types, flow, type Instance } from "mobx-state-tree";
import {
    login as apiLogin,
    register as apiRegister,
    restoreAccount as apiRestoreAccount,
    verifyEmail as apiVerifyEmail
} from "../api/auth.api";
import { tokenStorage } from "../../../shared/lib/token";
import type {
    LoginRequestDto,
    RegisterRequestDto,
    AuthResponseDto,
    RestoreResponseDto
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
    token: types.maybeNull(types.string),
    user: types.maybeNull(AuthUserModel),
    modalView: types.maybeNull(types.enumeration(["login", "register"])),
    isLoading: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
    successMessage: types.maybeNull(types.string),
    isDeletedAccount: types.optional(types.boolean, false),
})
    .views((self) => ({
        get isAuthenticated() {
            return Boolean(self.token);
        }
    }))
    .actions((self) => {
        function reset() {
            self.error = null;
            self.successMessage = null;
            self.isLoading = false;
            self.isDeletedAccount = false;
        }

        function decodeAndSetUser(token: string) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);

                let roles: { name: string }[] = [];
                if (typeof payload.scp === 'string') {
                    roles = payload.scp.split(' ').map((r: string) => ({ name: r }));
                } else if (Array.isArray(payload.scp)) {
                    roles = payload.scp.map((r: string) => ({ name: r }));
                } else if (Array.isArray(payload.roles)) {
                    roles = payload.roles.map((r: any) => ({ name: String(r.authority || r.name || r) }));
                }

                self.user = AuthUserModel.create({
                    id: payload.uid, // <--- CHANGED FROM userId TO uid
                    username: payload.sub,
                    roles: roles
                });
            } catch (error) {
                console.error("Failed to decode token:", error);
                self.user = null;
            }
        }

        function setToken(token: string) {
            self.token = token;
            tokenStorage.set(token);
            decodeAndSetUser(token);
        }

        const openLogin = () => {
            reset();
            self.modalView = 'login';
        };

        const openRegister = () => {
            reset();
            self.modalView = 'register';
        };

        const closeModal = () => {
            reset();
            self.modalView = null;
        };

        const clearError = () => {
            self.error = null;
        };

        const clearSuccessMessage = () => {
            self.successMessage = null;
        };

        const logout = () => {
            self.token = null;
            self.user = null;
            tokenStorage.clear();
        };

        const afterCreate = () => {
            const token = tokenStorage.get();
            if (token) {
                setToken(token);
            }
        };

        const login = flow(function* (data: LoginRequestDto) {
            self.isLoading = true;
            self.error = null;
            self.isDeletedAccount = false;

            try {
                const response = (yield apiLogin(data)) as AuthResponseDto;
                setToken(response.token);
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

        const register = flow(function* (data: RegisterRequestDto) {
            self.isLoading = true;
            self.error = null;
            self.successMessage = null;

            try {
                const message = (yield apiRegister(data)) as string;
                self.successMessage = message;
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
                const message = (yield apiVerifyEmail(token)) as string;
                self.successMessage = message;
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
                const response = (yield apiRestoreAccount(data)) as RestoreResponseDto;
                self.successMessage = response.message;

                const loginResponse = (yield apiLogin(data)) as AuthResponseDto;
                setToken(loginResponse.token);
                closeModal();
            } catch (error: unknown) {
                self.error = getErrorMessage(error);
            } finally {
                self.isLoading = false;
            }
        });

        return {
            reset,
            decodeAndSetUser,
            setToken,
            openLogin,
            openRegister,
            closeModal,
            clearError,
            clearSuccessMessage,
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