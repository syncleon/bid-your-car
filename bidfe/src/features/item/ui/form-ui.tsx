import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

const COLORS = {
    border: "#e2e8f0",
    focus: "#2563eb",
    error: "#ef4444",
    text: "#1e293b",
    textLight: "#64748b",
    bgInput: "#f8fafc",
};

interface FieldProps {
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}

const Field = ({ label, error, hint, children }: FieldProps) => (
    <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box"
    }}>
        <label style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text }}>
            {label}
        </label>
        {children}
        {error && <span style={{ fontSize: "12px", color: COLORS.error }}>{error}</span>}
        {!error && hint && <span style={{ fontSize: "12px", color: COLORS.textLight }}>{hint}</span>}
    </div>
);

const baseInputStyle: React.CSSProperties = {
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
    boxSizing: "border-box",
};

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
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                backgroundSize: "12px",
                paddingRight: "30px",
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
        <div style={{
            display: "grid",
            // Ensures columns don't get squashed below 280px
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            width: "100%"
        }}>
            {children}
        </div>
    </div>
);