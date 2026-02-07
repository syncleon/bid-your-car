import { Modal } from "../../../shared/ui/Modal";
import { SubmitItemForm } from "./SubmitItemForm";
import type { ItemDto, ItemUpdateRequest } from "../types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        data: ItemUpdateRequest,
        files: File[],
        deletedImageIds: string[]
    ) => Promise<void>;
    isLoading: boolean;
}

export const EditItemModal = ({
                                  item,
                                  isOpen,
                                  onClose,
                                  onSubmit,
                                  isLoading
                              }: Props) => {
    if (!isOpen || !item) return null;

    const initialData: Partial<ItemUpdateRequest> & { images: any[] } = {
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
        images: item.images
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit ${item.year} ${item.make} ${item.model}`}
        >
            <div style={{ padding: "0 4px" }}>
                <SubmitItemForm
                    key={item.id}
                    isEditMode={true}
                    initialData={initialData}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    isLoading={isLoading}
                    submitLabel="Save Changes"
                />
            </div>
        </Modal>
    );
};
