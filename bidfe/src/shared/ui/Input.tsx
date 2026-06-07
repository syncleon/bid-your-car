import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = ({ label, error, fullWidth = false, style, ...props }: InputProps) => {
    const containerStyle = fullWidth ? { width: "100%" } : {};

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...containerStyle }}>
            {label && (
                <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {label}
                </label>
            )}
            <input
                style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 16px",
                    borderRadius: "12px",
                    border: `1px solid ${error ? "var(--color-danger-text)" : "var(--border-color)"}`,
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    ...style
                }}
                {...props}
            />
            {error && (
                <span style={{ fontSize: "12px", color: "var(--color-danger-text)", fontWeight: 500 }}>
                    {error}
                </span>
            )}
        </div>
    );
};
