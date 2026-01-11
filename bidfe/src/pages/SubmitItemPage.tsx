import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { itemStore } from "../features/item/model/item.store";
import type { ItemSubmitRequest } from "../features/item/types";
import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();

    // ✅ UPDATED: Now accepts 'files' as the second argument
    const handleFormSubmit = async (data: ItemSubmitRequest, files: File[]) => {
        const success = await itemStore.submitItem(data, files);
        if (success) {
            navigate("/");
        }
    };

    return (
        <div style={pageStyles.container}>
            <h1 style={pageStyles.title}>Tell more about your car</h1>
            <p style={pageStyles.subtitle}>
                Fill in the details below to list your vehicle on the marketplace.
            </p>

            <div style={pageStyles.card}>
                {/* Error Alert */}
                {itemStore.error && (
                    <div style={pageStyles.errorAlert}>
                        <strong>Error:</strong> {itemStore.error}
                    </div>
                )}

                {/* ✅ NEW: Upload Progress Indicator */}
                {itemStore.isLoading && itemStore.uploadProgress && (
                    <div style={pageStyles.progressAlert}>
                        <div style={pageStyles.spinner}></div>
                        {itemStore.uploadProgress}
                    </div>
                )}

                <SubmitItemForm
                    onSubmit={handleFormSubmit}
                    isLoading={itemStore.isLoading}
                />
            </div>
        </div>
    );
});

// --- Page Styles ---
const pageStyles = {
    container: {
        padding: "24px",
        maxWidth: "720px",
        margin: "0 auto",
    },
    title: {
        fontSize: "28px",
        fontWeight: 700,
        marginBottom: "8px",
    },
    subtitle: {
        color: "#555",
        fontSize: "16px",
        marginBottom: "32px",
    },
    card: {
        padding: "32px",
        border: "1px solid #eaeaea",
        borderRadius: "12px",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    },
    errorAlert: {
        padding: "12px 16px",
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fca5a5",
        borderRadius: "6px",
        marginBottom: "24px",
        fontSize: "14px",
    },
    // New styles for the progress indicator
    progressAlert: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        background: "#eff6ff", // Light blue
        color: "#1d4ed8",      // Dark blue text
        border: "1px solid #bfdbfe",
        borderRadius: "6px",
        marginBottom: "24px",
        fontSize: "14px",
        fontWeight: 500,
    },
    spinner: {
        width: "16px",
        height: "16px",
        border: "2px solid #1d4ed8",
        borderTop: "2px solid transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    }
};

// Add global style for keyframes if not present elsewhere
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);