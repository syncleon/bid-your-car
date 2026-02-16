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
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxSizing: "border-box"
    } as React.CSSProperties,

    primaryBtn: {
        width: "100%",
        padding: "12px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#fff",
        backgroundColor: "#111",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "8px",
        transition: "opacity 0.2s",
        textDecoration: "none",
        display: "inline-block",
        boxSizing: "border-box",
        textAlign: "center"
    } as React.CSSProperties,

    restoreBtn: {
        width: "100%",
        padding: "10px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#fff",
        backgroundColor: "#ca8a04",
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
        textAlign: "center",
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
    } as React.CSSProperties,

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
    } as React.CSSProperties,

    pageContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
    } as React.CSSProperties,

    contentBoxBase: {
        position: "relative",
        width: "100%",
        maxWidth: "440px",
        padding: "40px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxSizing: "border-box",
    } as React.CSSProperties,

    contentBoxModal: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        border: "none",
    } as React.CSSProperties,

    contentBoxPage: {
        boxShadow: "none",
        border: "1px solid #f3f4f6",
    } as React.CSSProperties,

    closeButton: {
        position: "absolute",
        top: "16px",
        right: "20px",
        background: "none",
        border: "none",
        fontSize: "24px",
        cursor: "pointer",
        color: "#9ca3af",
        transition: "color 0.2s",
    } as React.CSSProperties,

    successContainer: {
        textAlign: "center",
        padding: "32px 0",
    } as React.CSSProperties,

    successIcon: {
        fontSize: "48px",
        margin: "0 0 16px 0",
    } as React.CSSProperties
};