import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";
import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest, ImageCategory } from "../features/item/types";
import "./SubmitItemPage.css";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();
    const { itemStore } = useStore();

    const handleSubmit = async (
        data: ItemCreateRequest,
        filesWithCategories: { file: File; category: ImageCategory }[]
    ) => {
        const newItem = await itemStore.submitNewItem(data, filesWithCategories);

        if (newItem) {
            navigate(`/items/${newItem.id}`);
        }
    };

    return (
        <div className="submit-page-wrapper">
            
            {/* Full Screen Immersive Background */}
            <div className="immersive-background">
                <img src="/premium-interior-car.jpg" alt="Premium luxury car interior" className="immersive-image" />
                <div className="immersive-overlay"></div>
            </div>

            {/* Floating Glass Modal */}
            <div className="glass-modal-scroll-area">
                <div className="glass-modal-container">
                    <div className="glass-modal">
                        {itemStore.error && (
                            <div className="error-banner">
                                ⚠️ {itemStore.error}
                            </div>
                        )}

                        <SubmitItemForm
                            onSubmit={handleSubmit}
                            isLoading={itemStore.isLoading}
                            submitLabel="Create Listing"
                            onCancel={() => navigate(-1)}
                        />
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            {itemStore.uploadProgress && (
                <div className="progress-overlay">
                    <div className="progress-card">
                        <div className="progress-spinner" />
                        <p>{itemStore.uploadProgress}</p>
                    </div>
                </div>
            )}
            
        </div>
    );
});