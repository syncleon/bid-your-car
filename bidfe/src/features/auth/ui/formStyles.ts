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
        color: "var(--text-primary)",
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px",
        transition: "color 0.3s ease" // Added
    } as React.CSSProperties,

    subHeader: {
        fontSize: "14px",
        color: "var(--text-secondary)",
        margin: "0 0 32px 0",
        transition: "color 0.3s ease" // Added
    } as React.CSSProperties,

    inputGroup: {
        marginBottom: "20px"
    } as React.CSSProperties,

    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "500",
        color: "var(--text-secondary)",
        marginBottom: "6px",
        transition: "color 0.3s ease" // Added
    } as React.CSSProperties,

    input: {
        width: "100%",
        padding: "12px 16px",
        fontSize: "14px",
        color: "var(--text-primary)",
        backgroundColor: "var(--bg-input)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        outline: "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease", // Smoothed
        boxSizing: "border-box"
    } as React.CSSProperties,

    primaryBtn: {
        width: "100%",
        padding: "12px",
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--btn-primary-text)",
        backgroundColor: "var(--btn-primary-bg)",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "8px",
        transition: "opacity 0.2s, background-color 0.3s ease, color 0.3s ease", // Smoothed
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
        color: "var(--bg-base)", // Updated for better contrast against the warning background
        backgroundColor: "var(--color-warning-text)",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        transition: "background-color 0.3s ease, color 0.3s ease" // Added
    } as React.CSSProperties,

    linkBtn: {
        background: "none",
        border: "none",
        padding: 0,
        color: "var(--text-primary)",
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: "2px",
        transition: "color 0.3s ease" // Added
    } as React.CSSProperties,

    footer: {
        marginTop: "24px",
        textAlign: "center",
        fontSize: "14px",
        color: "var(--text-secondary)",
        transition: "color 0.3s ease" // Added
    } as React.CSSProperties,

    errorBanner: {
        backgroundColor: "var(--color-danger-bg)",
        color: "var(--color-danger-text)",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "24px",
        border: "1px solid var(--color-danger-border)",
        transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease" // Added
    } as React.CSSProperties,

    successBanner: {
        backgroundColor: "var(--color-success-bg)",
        color: "var(--color-success-text)",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "24px",
        border: "1px solid var(--color-success-border)",
        transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease" // Added
    } as React.CSSProperties,

    warningBox: {
        backgroundColor: "var(--color-warning-bg)",
        border: "1px solid var(--color-warning-border)",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "24px",
        color: "var(--color-warning-text)",
        transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease" // Added
    } as React.CSSProperties,

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "var(--bg-overlay)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
        transition: "background-color 0.3s ease" // Added
    } as React.CSSProperties,

    pageContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        transition: "background-color 0.3s ease"
    } as React.CSSProperties,

    contentBoxBase: {
        position: "relative",
        width: "100%",
        maxWidth: "440px",
        padding: "40px",
        backgroundColor: "var(--bg-card)",
        borderRadius: "16px",
        boxSizing: "border-box",
        border: "1px solid var(--border-color)",
        transition: "background-color 0.3s ease, border-color 0.3s ease"
    } as React.CSSProperties,

    contentBoxModal: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    } as React.CSSProperties,

    contentBoxPage: {
        boxShadow: "none",
    } as React.CSSProperties,

    closeButton: {
        position: "absolute",
        top: "16px",
        right: "20px",
        background: "none",
        border: "none",
        fontSize: "24px",
        cursor: "pointer",
        color: "var(--text-muted)",
        transition: "color 0.3s ease", // Smoothed
    } as React.CSSProperties,

    successContainer: {
        textAlign: "center",
        padding: "32px 0",
    } as React.CSSProperties,

    successIcon: {
        fontSize: "48px",
        margin: "0 0 16px 0",
        color: "var(--color-success-text)",
        transition: "color 0.3s ease" // Added
    } as React.CSSProperties
};