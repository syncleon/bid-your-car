import { Modal } from "../../../shared/ui/Modal";
import { SubmitItemForm } from "./SubmitItemForm";
import type { ItemDto, ItemCreateRequest, ItemImageDto, ImageCategory } from "../types";

interface Props {
    item: ItemDto | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        data: ItemCreateRequest,
        filesWithCategories: { file: File; category: ImageCategory }[],
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

    const initialData: Partial<ItemCreateRequest> & { images: ItemImageDto[] } = {
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
        fuelType: item.fuelType || "",
        horsepower: item.horsepower ?? ("" as unknown as number),
        condition: item.condition,
        titleStatus: item.titleStatus || "Clean",
        isModified: item.isModified,
        hasServiceHistory: item.hasServiceHistory,
        reservePrice: item.reservePrice ?? ("" as unknown as number),
        isNoReserve: item.isNoReserve,
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