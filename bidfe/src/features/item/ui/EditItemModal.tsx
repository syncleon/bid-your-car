import { Modal } from "../../../shared/ui/Modal";
import { SubmitItemForm } from "./SubmitItemForm";
import type { ItemDto, ItemCreateRequest } from "../types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    // Updated to ItemCreateRequest to match our refined backend/frontend types
    onSubmit: (data: ItemCreateRequest, files: File[]) => Promise<void>;
    onDeleteImage: (imageId: string) => Promise<void>;
    isLoading: boolean;
}

export const EditItemModal = ({
                                  item,
                                  isOpen,
                                  onClose,
                                  onSubmit,
                                  onDeleteImage,
                                  isLoading
                              }: Props) => {

    if (!isOpen || !item) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            // Better title for a vehicle marketplace
            title={`Edit ${item.year} ${item.make} ${item.model}`}
        >
            <div style={formWrapperStyle}>
                <SubmitItemForm
                    initialData={item}
                    onSubmit={onSubmit}
                    onDeleteImage={onDeleteImage}
                    isLoading={isLoading}
                />

                {/* Footer action for the Modal specifically */}
                <div style={footerStyle}>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        style={cancelBtnStyle}
                    >
                        Discard Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// --- Styles ---

const formWrapperStyle: React.CSSProperties = {
    padding: "0 4px", // Give the form some breathing room inside the modal
};

const footerStyle: React.CSSProperties = {
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #eee",
    textAlign: "right"
};

const cancelBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "color 0.2s"
};