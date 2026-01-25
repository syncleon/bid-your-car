import {minStyles} from "./minimalStyles.ts";

const styles = {
    section: {
        ...minStyles.section,
        borderBottom: '1px solid #eee',
        marginBottom: 12,
        paddingBottom: 24,
        paddingTop: 0,
        marginTop: 0
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", // Increased min-width slightly for better card proportions
        gap: "24px"
    },
    cardContainer: {
        position: "relative" as "relative",
        display: "flex",
        flexDirection: "column" as "column",
    },
    emptyState: {
        padding: "48px 0",
        textAlign: "center" as "center",
        color: "#6b7280",
        background: "#f9fafb",
        borderRadius: "8px",
        border: "1px dashed #e5e7eb"
    },
    linkBtn: {
        background: "none",
        border: "none",
        color: "#2563eb",
        textDecoration: "underline",
        cursor: "pointer",
        fontSize: "14px",
        marginTop: "8px"
    },

    // --- Action Row Styles ---
    actionRow: {
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        height: "24px",
    },
    actionGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    divider: {
        color: "#e5e7eb",
        fontSize: "12px"
    },

    // Buttons
    btnPrimary: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: "#2563eb", // Blue
        fontWeight: 600,
        fontSize: "12px",
        textTransform: "uppercase" as "uppercase",
        letterSpacing: "0.5px"
    },
    btnNeutral: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: "#4b5563", // Gray
        fontWeight: 500,
        fontSize: "12px",
        textTransform: "uppercase" as "uppercase",
        letterSpacing: "0.5px"
    },
    btnDestructive: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: "#dc2626", // Red
        fontWeight: 500,
        fontSize: "12px",
        textTransform: "uppercase" as "uppercase",
        letterSpacing: "0.5px"
    },
    statusSold: {
        color: "#d97706", // Amber
        fontWeight: 700,
        fontSize: "12px",
        textTransform: "uppercase" as "uppercase",
        letterSpacing: "0.5px",
    }
};

export default styles;