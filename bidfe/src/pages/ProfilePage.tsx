import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore";

export const ProfilePage = observer(() => {
    const { profileStore } = useStore();

    useEffect(() => {
        profileStore.loadProfile();
    }, [profileStore]);

    if (profileStore.isLoading) {
        return <p>Loading profile...</p>;
    }

    if (!profileStore.profile) {
        return <p>No profile data</p>;
    }

    const { username, email } = profileStore.profile;

    return (
        <div style={{ padding: 24 }}>
            <h1>Profile</h1>

            <div>
                <strong>Username:</strong> {username}
            </div>

            <div>
                <strong>Email:</strong> {email}
            </div>
        </div>
    );
});