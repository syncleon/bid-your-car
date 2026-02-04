import type {CSSProperties} from "react";

export const minStyles: Record<string, CSSProperties> = {
    section: {
        background: "#fff",
        borderRadius: "8px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb"
    },
    compactHeader: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "24px"
    },
    header: {
        fontSize: "18px",
        fontWeight: 600,
        marginBottom: "20px",
        color: "#111"
    },
    label: {
        display: "block",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "uppercase",
        color: "#6b7280",
        marginBottom: "6px",
        letterSpacing: "0.5px"
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "6px",
        border: "1px solid #d1d5db",
        fontSize: "14px",
        transition: "border-color 0.2s",
        outline: "none"
    },
    primaryBtn: {
        background: "#111",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "opacity 0.2s"
    },
    // ✅ ADDED THIS MISSING STYLE
    secondaryBtn: {
        background: "#fff",
        color: "#374151",
        border: "1px solid #d1d5db",
        padding: "10px 20px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s"
    },
    textBtn: {
        background: "none",
        border: "none",
        color: "#4b5563",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        textDecoration: "underline",
        padding: 0
    },
    avatar: {
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: 600,
        color: "#9ca3af"
    },
    settingsBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 500,
        color: "#374151",
        cursor: "pointer"
    },
    tabBtn: {
        padding: "0 0 8px 0",
        marginRight: "24px",
        background: "none",
        border: "none",
        borderBottom: "2px solid transparent",
        fontSize: "14px",
        color: "#6b7280",
        cursor: "pointer",
        fontWeight: 500
    },
    activeTab: {
        color: "#111",
        borderBottomColor: "#111"
    }
};