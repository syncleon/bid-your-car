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
    const [password, setPassword] = useState<number>(0);

    const submit = async () => {
        await authStore.login(username, password);
        onSuccess();
    };

    return (
        <>
            <h2>Login</h2>

            <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                placeholder="Password"
                type="number"
                value={password}
                onChange={(e) => setPassword(Number(e.target.value))}
            />

            <button onClick={submit} disabled={authStore.isLoading}>
                Login
            </button>

            <p>
                No account?{" "}
                <button onClick={onSwitchToRegister}>Register</button>
            </p>
        </>
    );
});
