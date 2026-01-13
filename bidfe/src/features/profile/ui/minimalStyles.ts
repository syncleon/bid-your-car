import type { CSSProperties } from "react";

export const minStyles = {
    section: {
        padding: "24px 0",
        borderBottom: "1px solid #f0f0f0",
    } as CSSProperties,
    header: {
        fontSize: "16px",
        fontWeight: 600,
        marginBottom: "16px",
        color: "#111",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    } as CSSProperties,
    label: {
        display: "block",
        fontSize: "12px",
        color: "#666",
        marginBottom: "4px",
        fontWeight: 500
    } as CSSProperties,
    input: {
        width: "100%",
        padding: "8px 0",
        border: "none",
        borderBottom: "1px solid #e5e5e5",
        fontSize: "14px",
        outline: "none",
        background: "transparent",
        transition: "border-color 0.2s",
        marginBottom: "16px"
    } as CSSProperties,
    primaryBtn: {
        background: "#000",
        color: "#fff",
        border: "none",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        borderRadius: "4px",
    } as CSSProperties,
    textBtn: {
        background: "none",
        border: "none",
        padding: 0,
        color: "#666",
        textDecoration: "underline",
        cursor: "pointer",
        fontSize: "12px",
    } as CSSProperties,
    avatar: {
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "#f3f4f6",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: 600,
        marginRight: "24px"
    } as CSSProperties,
    compactHeader: {
        display: "flex",
        alignItems: "center",
        paddingBottom: "32px",
        borderBottom: "1px solid #eee",
        marginBottom: "32px"
    } as CSSProperties,
    settingsBtn: {
        background: "#fff",
        border: "1px solid #e5e5e5",
        color: "#111",
        padding: "6px 12px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "6px"
    } as CSSProperties,
    tabBtn: {
        background: "none",
        border: "none",
        borderBottom: "2px solid transparent",
        padding: "0 0 8px 0",
        marginRight: "20px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 500,
        color: "#999",
        transition: "all 0.2s"
    } as CSSProperties,
    activeTab: {
        color: "#000",
        borderBottom: "2px solid #000"
    } as CSSProperties
};