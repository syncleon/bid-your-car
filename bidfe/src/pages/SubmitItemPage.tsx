import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";
import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest } from "../features/item/types";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();
    const { itemStore } = useStore();

    const handleSubmit = async (data: ItemCreateRequest, files: File[]) => {
        const success = await itemStore.submitItem(data, files);
        if (success) {
            navigate(itemStore.selectedItem?.id ? `/items/${itemStore.selectedItem.id}` : "/profile");
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Sell Your Car</h1>
                    <p style={styles.subtitle}>Tell us about your vehicle to get started.</p>
                </div>

                {itemStore.error && (
                    <div style={styles.errorBanner}>
                        ⚠️ {itemStore.error}
                    </div>
                )}

                <div style={styles.card}>
                    <SubmitItemForm
                        onSubmit={handleSubmit}
                        isLoading={itemStore.isLoading}
                        submitLabel="Create Listing"
                        onCancel={() => navigate(-1)}
                    />
                </div>
            </div>
        </div>
    );
});

const styles = {
    pageWrapper: { minHeight: "100vh", background: "#f9fafb", padding: "40px 20px" },
    container: { maxWidth: "700px", margin: "0 auto" },
    header: { textAlign: "center" as const, marginBottom: "32px" },
    title: { fontSize: "32px", fontWeight: 800, color: "#111", marginBottom: "8px" },
    subtitle: { fontSize: "16px", color: "#6b7280" },
    card: { background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" },
    errorBanner: { background: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #fca5a5" }
};