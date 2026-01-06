import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { itemStore } from "../features/item/model/item.store";
import type { ItemSubmitRequest } from "../features/item/types";
import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();

    const handleFormSubmit = async (data: ItemSubmitRequest) => {
        const success = await itemStore.submitItem(data);
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
                {itemStore.error && (
                    <div style={pageStyles.errorAlert}>
                        <strong>Error:</strong> {itemStore.error}
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
};