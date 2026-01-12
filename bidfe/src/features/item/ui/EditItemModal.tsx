import { Modal } from "../../../shared/ui/Modal";
import { SubmitItemForm } from "./SubmitItemForm";
import type { ItemDto, ItemSubmitRequest } from "../types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    // ✅ UPDATED: Now accepts 'files' (new images to upload)
    onSubmit: (data: ItemSubmitRequest, files: File[]) => Promise<void>;
    // ✅ NEW: Callback to delete an existing image from the server
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
        <Modal isOpen={isOpen} onClose={onClose}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <div style={{ flex: 1 }}>
                        <h2 style={styles.title}>Edit Listing</h2>
                        <div style={styles.badge}>
                            Editing: <strong>{item.make} {item.model}</strong>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={styles.closeBtn}
                        aria-label="Close modal"
                        title="Close (Esc)"
                    >
                        &times;
                    </button>
                </div>
                <div style={styles.body}>
                    <p style={styles.instructions}>
                        Update the vehicle information below. New photos are uploaded when you click Save.
                    </p>

                    <SubmitItemForm
                        initialData={item}
                        onSubmit={onSubmit}         // ✅ Pass the update handler
                        onDeleteImage={onDeleteImage} // ✅ Pass the delete handler
                        isLoading={isLoading}
                    />

                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.cancelLink}
                            disabled={isLoading}
                        >
                            Cancel and discard changes
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const styles = {
    // ... (Your existing styles remain exactly the same)
    container: {
        width: "100%",
        maxWidth: "720px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column" as const,
        maxHeight: "90vh",
        margin: "0 auto",
        position: "relative" as const,
    },
    header: {
        padding: "20px 32px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        background: "#fff",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        position: "sticky" as const,
        top: 0,
        zIndex: 10,
    },
    title: {
        fontSize: "22px",
        fontWeight: 700,
        margin: "0 0 6px 0",
        color: "#111",
    },
    badge: {
        display: "inline-block",
        background: "#f3f4f6",
        color: "#4b5563",
        fontSize: "13px",
        padding: "4px 10px",
        borderRadius: "20px",
        lineHeight: 1.4,
    },
    closeBtn: {
        background: "transparent",
        border: "none",
        fontSize: "32px",
        lineHeight: "0.8",
        color: "#9ca3af",
        cursor: "pointer",
        padding: "8px",
        marginLeft: "16px",
        borderRadius: "50%",
        transition: "color 0.2s, background 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "40px",
        height: "40px",
    },
    body: {
        padding: "32px",
        overflowY: "auto" as const,
        overscrollBehavior: "contain",
    },
    instructions: {
        fontSize: "14px",
        color: "#6b7280",
        margin: "0 0 24px 0",
        lineHeight: 1.5,
    },
    cancelLink: {
        background: "none",
        border: "none",
        color: "#6b7280",
        fontSize: "14px",
        cursor: "pointer",
        textDecoration: "underline",
        padding: "8px",
    }
};