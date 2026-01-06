import { ChangePasswordForm } from "./ChangePasswordForm";

export const SecurityCard = () => {
    return (
        <section style={cardStyle}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Security</h2>
            <ChangePasswordForm />
        </section>
    );
};

const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #eaeaea",
    borderRadius: 8,
    padding: 24,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
};