import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import type { ItemSubmitRequest, ItemDto, ItemImageDto } from "../types";
import { FormInput, FormSelect, FormSection } from "./form-ui";
import { ImageUploader } from "./ImageUploader";

// --- Constants ---
const BODY_STYLES = ["Sedan", "Coupe", "SUV", "Convertible", "Hatchback", "Wagon", "Truck", "Van"].map(v => ({ value: v, label: v }));
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT"].map(v => ({ value: v, label: v }));
const DRIVETRAINS = ["RWD", "FWD", "AWD", "4WD"].map(v => ({ value: v, label: v }));
const SELLER_TYPES = [{ value: "Private Party", label: "Private Party" }, { value: "Dealer", label: "Dealership" }];

interface Props {
    initialData?: ItemDto;
    onSubmit: (data: ItemSubmitRequest, files: File[]) => void;
    onDeleteImage?: (imageId: string) => void;
    isLoading: boolean;
}

export const SubmitItemForm = ({ initialData, onSubmit, onDeleteImage, isLoading }: Props) => {

    // 1. Form State
    const initial = (key: keyof ItemSubmitRequest, fallback: any = "") => initialData ? (initialData as any)[key] ?? fallback : fallback;

    const [formData, setFormData] = useState<ItemSubmitRequest>({
        make: initial("make"), model: initial("model"), vin: initial("vin"), location: initial("location"),
        buyNowPrice: initial("buyNowPrice", null), engine: initial("engine"), transmission: initial("transmission"),
        drivetrain: initial("drivetrain"), bodyStyle: initial("bodyStyle"), exteriorColor: initial("exteriorColor"),
        interiorColor: initial("interiorColor"), sellerType: initial("sellerType"),
    });

    // 2. Error State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // 3. Image State
    const [existingImages, setExistingImages] = useState<ItemImageDto[]>(initialData?.images || []);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => { if (initialData?.images) setExistingImages(initialData.images); }, [initialData]);
    useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

    // --- Handlers ---

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Clear error when user types
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));

        setFormData(prev => ({
            ...prev,
            // Special handling for VIN (Uppercase) and Price (Number)
            [name]: name === "buyNowPrice" ? (value === "" ? null : Number(value))
                : name === "vin" ? value.toUpperCase()
                    : value
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
            setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
        }
    };

    const removeNew = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const removeExisting = (id: string) => {
        if (onDeleteImage && confirm("Are you sure you want to delete this image?")) {
            onDeleteImage(id);
            setExistingImages(prev => prev.filter(img => img.id !== id));
        }
    };

    // --- Validation ---
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.vin || formData.vin.length !== 17) newErrors.vin = "VIN must be exactly 17 characters.";
        if (!formData.make) newErrors.make = "Make is required.";
        if (!formData.model) newErrors.model = "Model is required.";
        if (!formData.location) newErrors.location = "Location is required.";
        if (!formData.buyNowPrice) newErrors.buyNowPrice = "Please set a price.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData, files);
        } else {
            // Scroll to top to see errors
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: "800px", margin: "0 auto" }}>

            {/* 1. Essentials */}
            <FormSection title="Vehicle Essentials" description="Let's start with the basics found on your title.">
                <FormInput
                    label="VIN"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    maxLength={17}
                    placeholder="e.g. 1HGCM..."
                    error={errors.vin}
                    hint="17 alphanumeric characters."
                />
                <div style={gridRow}>
                    <FormInput label="Make" name="make" value={formData.make} onChange={handleChange} error={errors.make} placeholder="e.g. Porsche" />
                    <FormInput label="Model" name="model" value={formData.model} onChange={handleChange} error={errors.model} placeholder="e.g. 911 Carrera" />
                </div>
                <FormSelect label="Body Style" name="bodyStyle" value={formData.bodyStyle || ""} onChange={handleChange} options={BODY_STYLES} />
            </FormSection>

            {/* 2. Photos */}
            <FormSection title="Photos" description="Great photos increase sales by 50%. The first photo will be your cover.">
                <ImageUploader
                    existingImages={existingImages}
                    newPreviews={previews}
                    onAddFiles={handleFileChange}
                    onRemoveExisting={removeExisting}
                    onRemoveNew={removeNew}
                />
            </FormSection>

            {/* 3. Specs */}
            <FormSection title="Technical Specs" description="Details about the performance and configuration.">
                <FormInput label="Engine" name="engine" value={formData.engine || ""} onChange={handleChange} placeholder="e.g. 3.0L Flat-6" />
                <div style={gridRow}>
                    <FormSelect label="Transmission" name="transmission" value={formData.transmission || ""} onChange={handleChange} options={TRANSMISSIONS} />
                    <FormSelect label="Drivetrain" name="drivetrain" value={formData.drivetrain || ""} onChange={handleChange} options={DRIVETRAINS} />
                </div>
            </FormSection>

            {/* 4. Sale Info */}
            <FormSection title="Sale Details" description="Where is the car located and how much do you want for it?">
                <div style={gridRow}>
                    <FormInput label="Exterior Color" name="exteriorColor" value={formData.exteriorColor || ""} onChange={handleChange} placeholder="e.g. Guards Red" />
                    <FormInput label="Interior Color" name="interiorColor" value={formData.interiorColor || ""} onChange={handleChange} placeholder="e.g. Black Leather" />
                </div>
                <FormInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={errors.location}
                    placeholder="City, State"
                />
                <div style={gridRow}>
                    <FormInput
                        label="Asking Price ($)"
                        name="buyNowPrice"
                        type="number"
                        value={formData.buyNowPrice ?? ""}
                        onChange={handleChange}
                        error={errors.buyNowPrice}
                        placeholder="0.00"
                    />
                    <FormSelect label="Are you a dealer?" name="sellerType" value={formData.sellerType || ""} onChange={handleChange} options={SELLER_TYPES} />
                </div>
            </FormSection>

            <button type="submit" disabled={isLoading} style={submitBtnStyle}>
                {isLoading ? "Processing..." : (initialData ? "Save Changes" : "Publish Listing")}
            </button>
        </form>
    );
};

// --- Local Styles ---
const gridRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };

const submitBtnStyle = {
    marginTop: "20px",
    width: "100%",
    padding: "16px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.1s"
};