import type {CSSProperties} from "react";

const styles = {
    // Layout & Container
    link: { textDecoration: "none", color: "inherit", display: "block" } as CSSProperties,
    container: {
        background: "#fff",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "pointer",
        // Adding subtle hover effect transition
        transition: "transform 0.2s, box-shadow 0.2s",
    } as CSSProperties,

    // Image Section
    imageWrapper: {
        aspectRatio: "16/10",
        width: "100%",
        background: "#f3f4f6",
        position: "relative" as "relative",
        overflow: "hidden",
    } as CSSProperties,
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover" as "cover",
        display: "block",
    } as CSSProperties,
    placeholder: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        fontSize: "12px",
        textTransform: "uppercase" as "uppercase",
    } as CSSProperties,

    // Typography
    content: { padding: "12px 0 0 0" } as CSSProperties,
    title: {
        margin: "0 0 8px 0",
        fontSize: "17px",
        fontWeight: 600,
        color: "#111",
        lineHeight: 1.25,
    } as CSSProperties,
    year: { fontWeight: 400, color: "#6b7280" } as CSSProperties,

    // Metadata & Footer
    metaRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "4px",
    } as CSSProperties,
    labelText: {
        fontSize: "10px",
        color: "#9ca3af",
        fontWeight: 700,
        letterSpacing: "0.5px",
        marginBottom: "2px",
        textTransform: "uppercase" as "uppercase",
    } as CSSProperties,
    priceText: { fontSize: "18px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" } as CSSProperties,
    locationText: { fontSize: "13px", color: "#666", fontWeight: 500 } as CSSProperties,
    specsText: {
        fontSize: "12px",
        color: "#999",
        whiteSpace: "nowrap" as "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        marginTop: "8px",
        borderTop: "1px solid #eee",
        paddingTop: "8px",
    } as CSSProperties,

    // Overlays / Badges
    overlayTopLeft: { position: "absolute", top: "10px", left: "10px", zIndex: 2 } as CSSProperties,
    overlayBottomContainer: {
        position: "absolute",
        bottom: "10px",
        left: "10px",
        right: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        zIndex: 2
    } as CSSProperties,

    // Specific Badge Styles
    badgeDark: {
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 600,
        backdropFilter: "blur(4px)",
    } as CSSProperties,
    badgeLive: {
        background: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        letterSpacing: "0.5px",
    } as CSSProperties,
    badgeTimer: {
        padding: "4px 8px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        fontVariantNumeric: "tabular-nums",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        transition: "background 0.3s, color 0.3s",
    } as CSSProperties,
    dot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: "#ef4444",
        display: "block",
    } as CSSProperties,
};

export default styles;