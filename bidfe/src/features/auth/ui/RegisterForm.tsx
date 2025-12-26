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
        const [password, setPassword] = useState<number>(0);

        const submit = async () => {
            await authStore.register(username, password, email);
            onSuccess();
        };

        return (
            <>
                <h2>Register</h2>

                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    placeholder="Password"
                    type="number"
                    value={password}
                    onChange={(e) => setPassword(Number(e.target.value))}
                />

                <button onClick={submit} disabled={authStore.isLoading}>
                    Register
                </button>

                <p>
                    Already have an account?{" "}
                    <button onClick={onSwitchToLogin}>Login</button>
                </p>
            </>
        );
    }
);