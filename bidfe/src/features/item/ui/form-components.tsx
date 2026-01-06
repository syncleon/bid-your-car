
// --- Styles ---
import type {ReactNode} from "react";

const styles = {
    sectionHeader: {
        fontSize: "18px",
        fontWeight: 600,
        marginBottom: "20px",
        color: "#111",
        borderBottom: "1px solid #f0f0f0",
        paddingBottom: "10px",
        marginTop: "10px"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
    },
    fieldWrapper: {
        display: "flex",
        flexDirection: "column" as const,
    },
    label: {
        marginBottom: "6px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#374151",
    },
    hint: {
        fontSize: "12px",
        color: "#888",
        marginTop: "4px",
    },
    input: {
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        fontSize: "14px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box" as const,
        backgroundColor: "#f9f9f9",
        transition: "border-color 0.2s, background-color 0.2s",
    },
};

// --- Helper Components ---

export const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
        <h3 style={styles.sectionHeader}>{title}</h3>
        <div style={styles.grid}>{children}</div>
    </section>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
}

export const FormInput = ({ label, hint, style, ...props }: InputProps) => (
    <div style={styles.fieldWrapper}>
        <label style={styles.label}>{label}</label>
        <input
            style={{ ...styles.input, ...style }}
            onFocus={(e) => e.target.style.backgroundColor = "#fff"}
            onBlur={(e) => e.target.style.backgroundColor = "#f9f9f9"}
            {...props}
        />
        {hint && <span style={styles.hint}>{hint}</span>}
    </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string; label: string }[];
    hint?: string;
}

export const FormSelect = ({ label, options, hint, style, ...props }: SelectProps) => (
    <div style={styles.fieldWrapper}>
        <label style={styles.label}>{label}</label>
        <select
            style={{ ...styles.input, ...style }}
            onFocus={(e) => e.target.style.backgroundColor = "#fff"}
            onBlur={(e) => e.target.style.backgroundColor = "#f9f9f9"}
            {...props}
        >
            <option value="">Select...</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
        {hint && <span style={styles.hint}>{hint}</span>}
    </div>
);