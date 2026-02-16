import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";
import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest } from "../features/item/types";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();
    const { itemStore } = useStore();

    const handleSubmit = async (data: ItemCreateRequest, files: File[]) => {
        const newItem = await itemStore.submitNewItem(data, files);

        if (newItem) {
            navigate(`/items/${newItem.id}`);
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

                {/* OPTIONAL: Show upload progress if images are being processed */}
                {itemStore.uploadProgress && (
                    <div style={styles.progressOverlay}>
                        <div style={styles.progressCard}>
                            <div className="spinner" />
                            <p>{itemStore.uploadProgress}</p>
                        </div>
                    </div>
                )}
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
    errorBanner: { background: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #fca5a5" },

    // Progress styles
    progressOverlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    progressCard: { background: "#fff", padding: "24px 40px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", textAlign: "center" as const }
};