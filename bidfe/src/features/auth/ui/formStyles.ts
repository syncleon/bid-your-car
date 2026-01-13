import React from "react";

export const formStyles = {
    container: {
        maxWidth: "400px",
        margin: "0 auto",
        padding: "8px 4px"
    } as React.CSSProperties,

    header: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#111",
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px"
    } as React.CSSProperties,

    subHeader: {
        fontSize: "14px",
        color: "#666",
        margin: "0 0 32px 0"
    } as React.CSSProperties,

    inputGroup: {
        marginBottom: "20px"
    } as React.CSSProperties,

    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "500",
        color: "#374151",
        marginBottom: "6px"
    } as React.CSSProperties,

    input: {
        width: "100%",
        padding: "12px 16px",
        fontSize: "14px",
        color: "#111",
        backgroundColor: "#f9fafb", // Very light gray
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxSizing: "border-box" as const
    } as React.CSSProperties,

    primaryBtn: {
        width: "100%",
        padding: "12px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#fff",
        backgroundColor: "#111", // Minimalist Black
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "8px",
        transition: "opacity 0.2s"
    } as React.CSSProperties,

    restoreBtn: {
        width: "100%",
        padding: "10px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#fff",
        backgroundColor: "#ca8a04", // Dark Yellow/Amber
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    } as React.CSSProperties,

    linkBtn: {
        background: "none",
        border: "none",
        padding: 0,
        color: "#111",
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: "2px"
    } as React.CSSProperties,

    footer: {
        marginTop: "24px",
        textAlign: "center" as const,
        fontSize: "14px"
    } as React.CSSProperties,

    errorBanner: {
        backgroundColor: "#fef2f2",
        color: "#ef4444",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "24px",
        border: "1px solid #fee2e2"
    } as React.CSSProperties,

    successBanner: {
        backgroundColor: "#f0fdf4",
        color: "#166534",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "24px",
        border: "1px solid #dcfce7"
    } as React.CSSProperties,

    warningBox: {
        backgroundColor: "#fefce8",
        border: "1px solid #fef08a",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "24px"
    } as React.CSSProperties
};