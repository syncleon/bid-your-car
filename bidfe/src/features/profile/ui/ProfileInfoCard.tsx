import { observer } from "mobx-react-lite";
import type { Profile } from "../types";
import { minStyles } from "./minimalStyles";

interface Props {
    profile: Profile;
    onOpenSettings: () => void;
}

export const ProfileInfoSection = observer(({ profile, onOpenSettings }: Props) => {

    const formatDate = (isoString: string | null | undefined) => {
        if (!isoString) return "Unknown";
        return new Date(isoString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long'
        });
    };

    return (
        // CHANGED: Reduced marginBottom from 24 to 8
        <section style={{ ...minStyles.compactHeader, marginBottom: 8 }}>
            {/* Avatar */}
            <div style={minStyles.avatar}>
                {profile.username.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", margin: "0 0 2px 0", fontWeight: 600 }}>{profile.username}</h1>
                        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>{profile.email}</p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#999" }}>
                            Member since {formatDate(profile.createDate)}
                        </p>
                    </div>

                    <button onClick={onOpenSettings} style={minStyles.settingsBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Settings
                    </button>
                </div>
            </div>
        </section>
    );
});