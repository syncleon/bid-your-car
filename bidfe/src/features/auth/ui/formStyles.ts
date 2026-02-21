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
        color: "var(--text-primary)", // Updated
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px"
    } as React.CSSProperties,

    subHeader: {
        fontSize: "14px",
        color: "var(--text-secondary)", // Updated
        margin: "0 0 32px 0"
    } as React.CSSProperties,

    inputGroup: {
        marginBottom: "20px"
    } as React.CSSProperties,

    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "500",
        color: "var(--text-secondary)", // Updated
        marginBottom: "6px"
    } as React.CSSProperties,

    input: {
        width: "100%",
        padding: "12px 16px",
        fontSize: "14px",
        color: "var(--text-primary)", // Updated
        backgroundColor: "var(--bg-input)", // Updated
        border: "1px solid var(--border-color)", // Updated
        borderRadius: "8px",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.3s, color 0.3s",
        boxSizing: "border-box"
    } as React.CSSProperties,

    primaryBtn: {
        width: "100%",
        padding: "12px",
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--btn-primary-text)", // Updated
        backgroundColor: "var(--btn-primary-bg)", // Updated
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "8px",
        transition: "opacity 0.2s, background-color 0.3s, color 0.3s",
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
        color: "var(--btn-primary-text)",
        backgroundColor: "var(--color-warning-text)", // Using warning color for the restore button
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    } as React.CSSProperties,

    linkBtn: {
        background: "none",
        border: "none",
        padding: 0,
        color: "var(--text-primary)", // Updated
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: "2px"
    } as React.CSSProperties,

    footer: {
        marginTop: "24px",
        textAlign: "center",
        fontSize: "14px",
        color: "var(--text-secondary)" // Added
    } as React.CSSProperties,

    errorBanner: {
        backgroundColor: "var(--color-danger-bg)", // Updated
        color: "var(--color-danger-text)", // Updated
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "24px",
        border: "1px solid var(--color-danger-border)" // Updated
    } as React.CSSProperties,

    successBanner: {
        backgroundColor: "var(--color-success-bg)", // Updated
        color: "var(--color-success-text)", // Updated
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "24px",
        border: "1px solid var(--color-success-border)" // Updated
    } as React.CSSProperties,

    warningBox: {
        backgroundColor: "var(--color-warning-bg)", // Updated
        border: "1px solid var(--color-warning-border)", // Updated
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "24px",
        color: "var(--color-warning-text)" // Added
    } as React.CSSProperties,

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "var(--bg-overlay)", // Updated
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
        backgroundColor: "var(--bg-base)", // Updated
        transition: "background-color 0.3s ease"
    } as React.CSSProperties,

    contentBoxBase: {
        position: "relative",
        width: "100%",
        maxWidth: "440px",
        padding: "40px",
        backgroundColor: "var(--bg-card)", // Updated
        borderRadius: "16px",
        boxSizing: "border-box",
        border: "1px solid var(--border-color)", // Added border for dark mode contrast
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
        color: "var(--text-muted)", // Updated
        transition: "color 0.2s",
    } as React.CSSProperties,

    successContainer: {
        textAlign: "center",
        padding: "32px 0",
    } as React.CSSProperties,

    successIcon: {
        fontSize: "48px",
        margin: "0 0 16px 0",
        color: "var(--color-success-text)" // Added
    } as React.CSSProperties
};