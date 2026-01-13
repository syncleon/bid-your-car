import { Modal } from "../../../shared/ui/Modal";
import { SubmitItemForm } from "./SubmitItemForm";
import type { ItemDto, ItemSubmitRequest } from "../types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ItemSubmitRequest, files: File[]) => Promise<void>;
    onDeleteImage: (imageId: string) => Promise<void>;
    isLoading: boolean;
}

export const EditItemModal = ({ item, isOpen, onClose, onSubmit, onDeleteImage, isLoading }: Props) => {
    if (!isOpen || !item) return null;

    return (
        // Pass the title here so the Modal renders the header correctly
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit ${item.model}`}
        >
            {/* Direct Form rendering. No extra divs, no extra styles. */}
            <SubmitItemForm
                initialData={item}
                onSubmit={onSubmit}
                onDeleteImage={onDeleteImage}
                isLoading={isLoading}
            />

            <div style={{ marginTop: 20, textAlign: 'right' }}>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500
                    }}
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
};