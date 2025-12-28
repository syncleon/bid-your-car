import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../../shared/hooks/useStore";

interface Props {
    onSwitchToLogin: () => void;
    onSuccess: () => void;
}

export const RegisterForm = observer(
    ({ onSwitchToLogin, onSuccess }: Props) => {
        const { authStore } = useStore();

        const [username, setUsername] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");

        const submit = async () => {
            try {
                await authStore.register(username, password, email);
                onSuccess();
            } catch {
                // ❌ error already stored in authStore.error
                // keep modal open
            }
        };

        const clearError = () => {
            if (authStore.error) {
                authStore.clearError();
            }
        };

        return (
            <>
                <h2>Register</h2>

                {/* 🔴 Error message */}
                {authStore.error && (
                    <div style={{ color: "red", marginBottom: 12 }}>
                        {authStore.error}
                    </div>
                )}

                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        clearError();
                    }}
                />

                <input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        clearError();
                    }}
                />

                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        clearError();
                    }}
                />

                <button onClick={submit} disabled={authStore.isLoading}>
                    {authStore.isLoading ? "Registering..." : "Register"}
                </button>

                <p>
                    Already have an account?{" "}
                    <button onClick={onSwitchToLogin}>Login</button>
                </p>
            </>
        );
    }
);