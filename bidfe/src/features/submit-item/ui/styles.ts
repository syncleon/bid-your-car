export const styles = {
    stepHeader: { marginBottom: "32px" },
    stepCount: { fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    stepTitle: { fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0 0" },

    contentArea: { minHeight: "300px" },
    grid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" },
    halfGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },

    label: { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" },
    
    // We remove the old inline input styles and replace them with className="modern-input"
    // However, if any old code still relies on these inline styles, we leave a fallback.
    input: { },
    select: { },
    textarea: { },

    helperText: { fontSize: "13px", color: "var(--text-secondary)", marginTop: "16px", fontStyle: "italic" as const },

    footer: { display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" },
    backBtn: { background: "none", border: "none", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "color 0.2s" },
    primaryBtn: { background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "background-color 0.2s" },
    disabledBtn: { background: "var(--bg-input)", color: "var(--text-muted)", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "not-allowed", fontSize: "14px" },
    submitBtn: { background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "background-color 0.2s" }
};
