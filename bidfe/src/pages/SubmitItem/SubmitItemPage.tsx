import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../../shared/hooks/useStore";
import { SubmitItemForm } from "../../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest, ImageCategory } from "../../features/item/types";
import "./SubmitItemPage.css";

interface SubmitItemPageProps {
    isModal?: boolean;
}

export const SubmitItemPage = observer(({ isModal = false }: SubmitItemPageProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { itemStore } = useStore();

    useEffect(() => {
        if (isModal) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isModal]);

    const handleSubmit = async (
        data: ItemCreateRequest,
        filesWithCategories: { file: File; category: ImageCategory }[]
    ) => {
        const newItem = await itemStore.submitNewItem(data, filesWithCategories);

        if (newItem) {
            navigate(`/items/${newItem.id}`);
        }
    };

    const handleClose = () => {
        const bg = location.state?.backgroundLocation;
        if (bg) {
            navigate(`${bg.pathname}${bg.search || ""}${bg.hash || ""}`, { replace: true });
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={`submit-page-wrapper ${isModal ? 'is-modal' : ''}`}>
            
            {/* Full Screen Immersive Background */}
            {!isModal && (
                <div className="immersive-background">
                    <img src="/premium-interior-car.jpg" alt="Premium luxury car interior" className="immersive-image" />
                    <div className="immersive-overlay"></div>
                </div>
            )}

            {/* Floating Glass Modal */}
            <div className={`glass-modal-scroll-area ${isModal ? 'modal-scroll' : ''}`}>
                <div className={`glass-modal-container ${isModal ? 'modal-container' : ''}`} onClick={isModal ? (e) => e.stopPropagation() : undefined}>
                    {isModal && (
                        <button
                            className="submit-modal-close-btn"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    )}
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
                            onCancel={handleClose}
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