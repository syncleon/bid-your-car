import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";
import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest, ImageCategory } from "../features/item/types";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();
    const { itemStore } = useStore();

    const handleSubmit = async (
        data: ItemCreateRequest,
        filesWithCategories: { file: File; category: ImageCategory }[]
    ) => {
        // Pass the filesWithCategories directly to the store
        const newItem = await itemStore.submitNewItem(data, filesWithCategories);

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
    pageWrapper: { minHeight: "100vh", background: "var(--bg-base)", padding: "40px 20px", transition: "background-color 0.3s ease" },
    container: { maxWidth: "700px", margin: "0 auto" },
    header: { textAlign: "center" as const, marginBottom: "32px" },
    title: { fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px", transition: "color 0.3s ease" },
    subtitle: { fontSize: "16px", color: "var(--text-secondary)", transition: "color 0.3s ease" },
    card: { background: "var(--bg-card)", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid var(--border-color)", transition: "background-color 0.3s ease, border-color 0.3s ease" },
    errorBanner: { background: "var(--color-danger-bg)", color: "var(--color-danger-text)", padding: "12px", borderRadius: "8px", marginBottom: "24px", border: "1px solid var(--color-danger-border)" },

    progressOverlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    progressCard: { background: "var(--bg-card)", color: "var(--text-primary)", padding: "24px 40px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", textAlign: "center" as const, border: "1px solid var(--border-color)" }
};