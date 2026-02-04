import { Modal } from "../../../shared/ui/Modal";
import { SubmitItemForm } from "./SubmitItemForm";
import type { ItemDto, ItemCreateRequest } from "../types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    // The Store action usually expects (id, data, files), but here we bridge the gap
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

    // Transform ItemDto (Backend Response) -> Form Shape (Frontend Request)
    // We explicitly pick fields to avoid passing 'seller' object or metadata to the form state
    const initialData: Partial<ItemCreateRequest> & { images: any[] } = {
        year: item.year,
        make: item.make,
        model: item.model,
        vin: item.vin,
        location: item.location,
        mileage: item.mileage,
        description: item.description || "",
        engine: item.engine || "",
        transmission: item.transmission || "",
        drivetrain: item.drivetrain || "",
        bodyStyle: item.bodyStyle || "",
        exteriorColor: item.exteriorColor || "",
        interiorColor: item.interiorColor || "",
        sellerType: item.sellerType || "",
        // Pass existing images so the form can display them in the gallery
        images: item.images
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit ${item.year} ${item.make} ${item.model}`}
        >
            <div style={formWrapperStyle}>
                <SubmitItemForm
                    initialData={initialData}
                    onSubmit={onSubmit}
                    onDeleteImage={onDeleteImage}
                    isLoading={isLoading}
                />

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

const formWrapperStyle: React.CSSProperties = { padding: "0 4px" };
const footerStyle: React.CSSProperties = { marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #eee", textAlign: "right" };
const cancelBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "14px", fontWeight: 500, transition: "color 0.2s" };