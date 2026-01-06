import { useState } from "react";
import { ProfileEditForm } from "./ProfileEditForm";
import type { Profile } from "../types";

interface Props {
    profile: Profile;
}

export const ProfileInfoCard = ({ profile }: Props) => {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Profile Details</h2>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} style={textBtnStyle}>Edit</button>
                )}
            </div>

            {isEditing ? (
                <ProfileEditForm onCancel={() => setIsEditing(false)} />
            ) : (
                <div>
                    <p style={{ margin: "8px 0" }}><strong>Username:</strong> {profile.username}</p>
                    <p style={{ margin: "8px 0" }}><strong>Email:</strong> {profile.email}</p>
                </div>
            )}
        </section>
    );
};

// Styles
const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #eaeaea",
    borderRadius: 8,
    padding: 24,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
};

const textBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#2563eb",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 14
};