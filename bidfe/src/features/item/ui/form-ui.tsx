import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

// --- Design Tokens ---
const COLORS = {
    border: "#e2e8f0",
    focus: "#2563eb", // Blue for focus
    error: "#ef4444", // Red for error
    text: "#1e293b",
    textLight: "#64748b",
    bgInput: "#f8fafc",
};

// --- Wrapper with Error & Hint Support ---
interface FieldProps {
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}

const Field = ({ label, error, hint, children }: FieldProps) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text }}>
            {label}
        </label>
        {children}
        {error && <span style={{ fontSize: "12px", color: COLORS.error }}>{error}</span>}
        {!error && hint && <span style={{ fontSize: "12px", color: COLORS.textLight }}>{hint}</span>}
    </div>
);

// --- Input Component ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    hint?: string;
}

export const FormInput = ({ label, error, hint, style, ...props }: InputProps) => (
    <Field label={label} error={error} hint={hint}>
        <input
            style={{
                ...baseInputStyle,
                borderColor: error ? COLORS.error : COLORS.border,
                ...style
            }}
            {...props}
        />
    </Field>
);

// --- Select Component ---
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string; label: string }[];
    error?: string;
    hint?: string;
}

export const FormSelect = ({ label, options, error, hint, style, ...props }: SelectProps) => (
    <Field label={label} error={error} hint={hint}>
        <select
            style={{
                ...baseInputStyle,
                borderColor: error ? COLORS.error : COLORS.border,
                ...style
            }}
            {...props}
        >
            <option value="" disabled>Select an option...</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </Field>
);

export const FormSection = ({ title, description, children }: { title: string; description?: string, children: ReactNode }) => (
    <div style={{ marginBottom: "40px", paddingBottom: "30px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: COLORS.text, margin: "0 0 4px 0" }}>{title}</h3>
                {description && <p style={{ fontSize: "14px", color: COLORS.textLight, margin: 0 }}>{description}</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {children}
        </div>
    </div>
);

const baseInputStyle = {
    padding: "12px 16px",
    borderRadius: "8px",
    borderWidth: "1px",
    borderStyle: "solid",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    backgroundColor: COLORS.bgInput,
    color: COLORS.text,
    transition: "all 0.2s ease",
};