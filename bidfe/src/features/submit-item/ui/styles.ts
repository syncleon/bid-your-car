export const styles = {
    progressTrack: { height: "4px", background: "var(--bg-input)", borderRadius: "2px", overflow: "hidden", marginBottom: "20px" },
    progressBar: { height: "100%", background: "var(--accent-color)", transition: "width 0.3s ease" },
    stepHeader: { marginBottom: "32px" },
    stepCount: { fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    stepTitle: { fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0 0" },

    contentArea: { minHeight: "300px" },
    grid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" },
    halfGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },

    label: { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" },
    input: { width: "100%", height: "48px", padding: "0 12px", borderRadius: "8px", fontSize: "16px", outline: "none", boxSizing: "border-box" as const },
    select: { 
        width: "100%", 
        height: "48px", 
        padding: "0 16px", 
        borderRadius: "12px", 
        border: "1px solid var(--ghost-border)", 
        background: "var(--ghost-bg)", 
        backdropFilter: "var(--ghost-blur)",
        color: "var(--text-primary)", 
        fontSize: "16px", 
        fontWeight: 500,
        outline: "none", 
        cursor: "pointer", 
        boxSizing: "border-box" as const, 
        transition: "all 0.3s ease",
        appearance: "none" as const,
        WebkitAppearance: "none" as const,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 16px center",
        boxShadow: "var(--shadow-sm)"
    },
    textarea: { width: "100%", height: "120px", padding: "12px", borderRadius: "8px", fontSize: "16px", resize: "vertical" as const, boxSizing: "border-box" as const },

    helperText: { fontSize: "13px", color: "var(--text-secondary)", marginTop: "16px", fontStyle: "italic" as const },

    footer: { display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" },
    backBtn: { background: "none", border: "none", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "color 0.2s" },
    primaryBtn: { background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "background-color 0.2s" },
    disabledBtn: { background: "var(--bg-input)", color: "var(--text-muted)", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "not-allowed", fontSize: "14px" },
    submitBtn: { background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "background-color 0.2s" }
};
