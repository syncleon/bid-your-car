import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { FormInput, FormSection, FormSelect } from "./form-ui";
import { ImageUploader } from "./ImageUploader";
import type { ItemCreateRequest, ItemImageDto } from "../types";

// --- Constants ---
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => ({
    value: (currentYear + 1 - i).toString(),
    label: (currentYear + 1 - i).toString()
}));
const BODY_STYLES = ["Sedan", "Coupe", "SUV", "Convertible", "Hatchback", "Wagon", "Truck", "Van", "Motorcycle"].map(v => ({ value: v, label: v }));
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT", "PDK/Dual Clutch"].map(v => ({ value: v, label: v }));
const DRIVETRAINS = ["RWD", "FWD", "AWD", "4WD"].map(v => ({ value: v, label: v }));

type FormState = Omit<ItemCreateRequest, 'mileage'> & {
    mileage: number | "";
    images: ItemImageDto[];
};

interface Props {
    initialData?: Partial<ItemCreateRequest> & { images?: ItemImageDto[] };
    onSubmit: (data: ItemCreateRequest, files: File[], deletedImageIds: string[]) => void;
    onCancel?: () => void;
    isLoading: boolean;
    submitLabel?: string;
    isEditMode?: boolean;
}

export const SubmitItemForm = ({
                                   initialData,
                                   onSubmit,
                                   onCancel,
                                   isLoading,
                                   submitLabel = "Submit Listing",
                                   isEditMode = false
                               }: Props) => {

    const [formData, setFormData] = useState<FormState>({
        year: currentYear,
        make: "",
        model: "",
        vin: "",
        location: "",
        mileage: "",
        description: "",
        engine: "",
        transmission: "",
        drivetrain: "",
        bodyStyle: "",
        exteriorColor: "",
        interiorColor: "",
        sellerType: "",
        images: initialData?.images || [],
        ...initialData,
    });

    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        return () => previews.forEach(url => URL.revokeObjectURL(url));
    }, [previews]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));

        setFormData(prev => ({
            ...prev,
            [name]: name === "mileage" || name === "year"
                ? (value === "" ? "" : Number(value))
                : name === "vin" ? value.toUpperCase() : value
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
            setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
        }
    };

    const handleRemoveNew = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]);
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };

    const handleRemoveExisting = (id: string) => {
        if (!confirm("Are you sure you want to remove this photo?")) return;

        setFormData(prev => ({
            ...prev,
            images: prev.images.filter(img => img.id !== id)
        }));

        setDeletedImageIds(prev => [...prev, id]);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.make) newErrors.make = "Make is required";
        if (!formData.model) newErrors.model = "Model is required";
        if (!formData.location) newErrors.location = "Location is required";
        if (!formData.vin || formData.vin.length !== 17) newErrors.vin = "VIN must be 17 characters";
        if (formData.mileage === "") newErrors.mileage = "Mileage is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const { images, ...cleanPayload } = formData;
            const keepImageIds = images.filter(img => img.id).map(img => img.id);
            const payload = { ...cleanPayload, keepImageIds };

            onSubmit(payload as ItemCreateRequest, files, deletedImageIds);
        } else {
            const firstError = document.querySelector('[data-error="true"]');
            if(firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Vehicle Identity Section */}
            <FormSection title="Vehicle Identity">
                <FormInput disabled={isEditMode} label="VIN" name="vin" value={formData.vin} onChange={handleChange} maxLength={17} error={errors.vin} />
                <FormSelect label="Year" name="year" value={formData.year} onChange={handleChange} options={YEARS} />
                <FormInput label="Make" name="make" value={formData.make} onChange={handleChange} error={errors.make} />
                <FormInput label="Model" name="model" value={formData.model} onChange={handleChange} error={errors.model} />
                <FormInput label="Mileage" name="mileage" type="number" value={formData.mileage} onChange={handleChange} error={errors.mileage} />
                <FormInput label="Location" name="location" value={formData.location} onChange={handleChange} error={errors.location} />
            </FormSection>

            {/* Specifications */}
            <FormSection title="Specifications">
                <FormSelect label="Body Style" name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} options={BODY_STYLES} />
                <FormSelect label="Transmission" name="transmission" value={formData.transmission} onChange={handleChange} options={TRANSMISSIONS} />
                <FormSelect label="Drivetrain" name="drivetrain" value={formData.drivetrain} onChange={handleChange} options={DRIVETRAINS} />
                <FormInput label="Engine" name="engine" value={formData.engine || ""} onChange={handleChange} />
                <FormInput label="Exterior Color" name="exteriorColor" value={formData.exteriorColor || ""} onChange={handleChange} />
                <FormInput label="Interior Color" name="interiorColor" value={formData.interiorColor || ""} onChange={handleChange} />
            </FormSection>

            {/* Description */}
            <textarea name="description" value={formData.description || ""} onChange={handleChange} rows={6} placeholder="Tell the story of the car..." />

            {/* Image Uploader */}
            <ImageUploader
                existingImages={formData.images}
                newPreviews={previews}
                onAddFiles={handleFileChange}
                onRemoveExisting={handleRemoveExisting}
                onRemoveNew={handleRemoveNew}
            />

            {/* Actions */}
            <div className="form-actions">
                {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
                <button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : submitLabel}</button>
            </div>
        </form>
    );
};
