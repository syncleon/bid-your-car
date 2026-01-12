import type {CSSProperties} from "react";

export const minStyles = {
    section: {
        padding: "24px 0",
        borderBottom: "1px solid #f0f0f0",
    } as CSSProperties,
    header: {
        fontSize: "16px", // Smaller, cleaner header
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
        padding: "8px 0", // Tighter input
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
};