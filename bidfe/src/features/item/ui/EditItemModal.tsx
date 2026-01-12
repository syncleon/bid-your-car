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
        <Modal isOpen={isOpen} onClose={onClose}>
            <div style={modalStyles.container}>
                <div style={modalStyles.header}>
                    <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Edit {item.model}</h2>
                    <button onClick={onClose} style={modalStyles.closeBtn}>&times;</button>
                </div>

                <div style={{ padding: "32px" }}>
                    <SubmitItemForm
                        initialData={item}
                        onSubmit={onSubmit}
                        onDeleteImage={onDeleteImage}
                        isLoading={isLoading}
                    />
                    <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
                </div>
            </div>
        </Modal>
    );
};

const modalStyles = {
    container: { background: "#fff", borderRadius: "12px", maxWidth: "800px", width: "100%", margin: "24px auto", maxHeight: "90vh", overflowY: "auto" as const },
    header: { padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" },
    closeBtn: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" },
    cancelBtn: { background: "none", border: "none", color: "#666", textDecoration: "underline", width: "100%", marginTop: "16px", cursor: "pointer" }
};