export const styles = {
    card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", marginBottom: "24px" },
    header: { display: "flex", backgroundColor: "var(--bg-input)", padding: "16px 24px", alignItems: "center" },
    headerItem: { display: "flex", flexDirection: "column" as const, gap: "4px" },
    label: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, color: "var(--text-secondary)", letterSpacing: "0.5px" },
    value: { fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" },
    headerDivider: { width: "1px", height: "24px", backgroundColor: "var(--border-color)", margin: "0 24px" },
    divider: { height: "1px", backgroundColor: "var(--border-color)", width: "100%" },
    heroSection: { padding: "32px 24px 24px", textAlign: "center" as const },
    currentBidLabel: { fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
    reserveBadge: { color: "var(--color-success-text)", fontSize: "11px", fontWeight: 600, backgroundColor: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", padding: "2px 6px", borderRadius: "4px" },
    priceHero: { fontSize: "56px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-2px" },
    actionZone: { padding: "0 24px 32px" },

    errorBanner: {
        backgroundColor: "var(--color-danger-bg)",
        color: "var(--color-danger-text)",
        border: "1px solid var(--color-danger-border)",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        marginBottom: "16px",
        textAlign: "center" as const,
        animation: "slideDown 0.3s ease-out"
    },

    quickBidMasterBtn: { width: "100%", height: "64px", border: "1px solid var(--border-color)", borderRadius: "8px", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.5px", transition: "all 0.2s" },
    orDivider: { display: "flex", alignItems: "center", margin: "24px 0", gap: "12px" },
    orLine: { flex: 1, height: "1px", backgroundColor: "var(--border-color)" },
    orText: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px" },
    inputContainer: { display: "flex", alignItems: "center", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "4px 12px", marginBottom: "12px", transition: "border 0.2s", height: "56px" },
    currencySymbol: { fontSize: "20px", fontWeight: 500, color: "var(--text-muted)", marginRight: "4px" },
    input: { flex: 1, border: "none", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", background: "transparent", outline: "none", width: "100%", padding: 0 },
    primaryBtn: { width: "100%", height: "56px", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", cursor: "pointer", transition: "all 0.2s" },
    finePrint: { marginTop: "12px", fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" as const },
    statusBanner: { backgroundColor: "var(--bg-input)", color: "var(--text-secondary)", fontWeight: 700, textAlign: "center" as const, padding: "16px", borderRadius: "8px", fontSize: "14px", letterSpacing: "0.5px" },
    statusBannerOwned: { backgroundColor: "var(--bg-hover)", color: "var(--accent-color)", border: "1px solid var(--border-color)", fontWeight: 700, textAlign: "center" as const, padding: "16px", borderRadius: "8px", fontSize: "14px", letterSpacing: "0.5px" }
};
