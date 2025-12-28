import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../../shared/hooks/useStore";

interface Props {
    onSwitchToRegister: () => void;
    onSuccess: () => void;
}

export const LoginForm = observer(({ onSwitchToRegister, onSuccess }: Props) => {
    const { authStore } = useStore();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = async () => {
        try {
            await authStore.login(username, password);
            onSuccess();
        } catch {
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
            <h2>Login</h2>
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
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                }}
            />

            <button onClick={submit} disabled={authStore.isLoading}>
                {authStore.isLoading ? "Logging in..." : "Login"}
            </button>

            <p>
                No account?{" "}
                <button onClick={onSwitchToRegister}>Register</button>
            </p>
        </>
    );
});