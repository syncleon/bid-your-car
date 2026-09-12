import React from "react";

export const minStyles = {
    textBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit", transition: "color 0.3s ease" } as React.CSSProperties,
};

export const styles = {
    container: { width: "92%", margin: "0 auto", padding: "16px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: "var(--text-primary)", transition: "color 0.3s ease" },
    headerRow: { marginBottom: 16, display: "flex", justifyContent: "space-between" },
    grid: { display: "grid", alignItems: "start" },

    galleryContainer: { display: "grid", gridTemplateColumns: "70fr 30fr", gap: "8px", margin: 0, padding: 0 },
    mainWrapper: { position: "relative" as const, width: "100%", height: "100%", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden", cursor: "zoom-in", backgroundColor: "var(--bg-input)", padding: 0, margin: 0 },
    mainImg: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" as const, transition: "transform 0.3s ease", display: "block" },
    hoverOverlay: { position: "absolute" as const, inset: 0, background: "rgba(249, 115, 22, 0.15)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "14px", pointerEvents: "none" as const, backdropFilter: "blur(2px)" },
    statusOverlay: { position: "absolute" as const, top: 16, left: 16, zIndex: 10 },
    thumbGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: 0, margin: 0, alignContent: "start" },
    thumbWrapper: { position: "relative" as const, aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", cursor: "pointer", backgroundColor: "var(--bg-input)", padding: 0, margin: 0 },
    thumbImg: { position: "absolute" as const, top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
    moreOverlay: { position: "absolute" as const, inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600, backdropFilter: "blur(2px)", borderRadius: "8px" },
    placeholder: { width: "100%", height: "300px", backgroundColor: "var(--bg-input)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px", transition: "background-color 0.3s ease, color 0.3s ease" },
    title: { fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0", letterSpacing: "-0.03em", lineHeight: 1.1 },
    subtitle: { fontSize: "15px", color: "#9ca3af", margin: 0, fontWeight: 500, letterSpacing: "0.01em" },
    tagsContainer: { display: "flex", gap: "8px", marginTop: "16px" },
    tag: { padding: "4px 10px", backgroundColor: "rgba(249, 115, 22, 0.1)", border: "1px solid var(--border-color)", borderRadius: "16px", fontSize: "12px", fontWeight: 600, color: "var(--color-primary)", transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease" },

    specsContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px", marginTop: "24px", padding: "24px 0", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", transition: "border-color 0.3s ease" },
    specItem: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    specLabel: { fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", transition: "color 0.3s ease" },
    specValue: { fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, letterSpacing: "-0.2px", textAlign: "right" as const, transition: "color 0.3s ease" },
    divider: { height: "1px", backgroundColor: "var(--border-color)", margin: "40px 0", transition: "background-color 0.3s ease" },
    sectionTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)", transition: "color 0.3s ease" },
    description: { fontSize: "16px", lineHeight: 1.6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" as const, transition: "color 0.3s ease" },

    card: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "24px", marginBottom: "24px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
    cardTitle: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "16px", transition: "color 0.3s ease" },
    sectionTitleCB: { fontSize: "20px", fontWeight: 700, marginTop: "32px", marginBottom: "16px", color: "var(--text-primary)" },
    descriptionCB: { fontSize: "15px", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" as const },
};
