import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import type { ItemCreateRequest, ItemDto, ItemImageDto } from "../types";
import { FormInput, FormSelect, FormSection } from "./form-ui";
import { ImageUploader } from "./ImageUploader";

// --- Constants ---
const BODY_STYLES = ["Sedan", "Coupe", "SUV", "Convertible", "Hatchback", "Wagon", "Truck", "Van"].map(v => ({ value: v, label: v }));
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT"].map(v => ({ value: v, label: v }));
const DRIVETRAINS = ["RWD", "FWD", "AWD", "4WD"].map(v => ({ value: v, label: v }));
const SELLER_TYPES = [{ value: "Private Party", label: "Private Party" }, { value: "Dealer", label: "Dealership" }];
const TITLE_STATUSES = ["Clean", "Salvage", "Rebuilt", "Lien"].map(v => ({ value: v, label: v }));

interface Props {
    initialData?: ItemDto;
    onSubmit: (data: ItemCreateRequest, files: File[]) => void; // Updated to ItemCreateRequest
    onDeleteImage?: (imageId: string) => void;
    isLoading: boolean;
}

export const SubmitItemForm = ({ initialData, onSubmit, onDeleteImage, isLoading }: Props) => {

    // 1. Form State Initialization
    const initial = (key: keyof ItemCreateRequest, fallback: any = "") =>
        initialData ? (initialData as any)[key] ?? fallback : fallback;

    const [formData, setFormData] = useState<ItemCreateRequest>({
        year: initial("year", new Date().getFullYear()),
        make: initial("make"),
        model: initial("model"),
        vin: initial("vin"),
        location: initial("location"),
        mileage: initial("mileage", 0),
        description: initial("description"),
        buyNowPrice: initial("buyNowPrice", null),
        engine: initial("engine"),
        transmission: initial("transmission"),
        drivetrain: initial("drivetrain"),
        bodyStyle: initial("bodyStyle"),
        exteriorColor: initial("exteriorColor"),
        interiorColor: initial("interiorColor"),
        sellerType: initial("sellerType"),
        titleStatus: initial("titleStatus"),
    });

    // 2. State Hooks
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [existingImages, setExistingImages] = useState<ItemImageDto[]>(initialData?.images || []);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => { if (initialData?.images) setExistingImages(initialData.images); }, [initialData]);
    useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

    // --- Handlers ---

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));

        setFormData(prev => ({
            ...prev,
            [name]: name === "buyNowPrice" ? (value === "" ? null : Number(value))
                : ["year", "mileage"].includes(name) ? Number(value)
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

    // --- Validation ---
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.vin || formData.vin.length !== 17) newErrors.vin = "VIN must be exactly 17 characters.";
        if (!formData.year || formData.year < 1900) newErrors.year = "Invalid year.";
        if (!formData.make) newErrors.make = "Make is required.";
        if (!formData.model) newErrors.model = "Model is required.";
        if (!formData.location) newErrors.location = "Location is required.";
        if (formData.mileage === undefined || formData.mileage < 0) newErrors.mileage = "Invalid mileage.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) onSubmit(formData, files);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>

            {/* 1. Essentials */}
            <FormSection title="Vehicle Essentials" description="Standard information found on your registration.">
                <FormInput
                    label="VIN"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    maxLength={17}
                    placeholder="17-character VIN"
                    error={errors.vin}
                />
                <div style={gridRow}>
                    <FormInput label="Year" name="year" type="number" value={formData.year} onChange={handleChange} error={errors.year} />
                    <FormInput label="Mileage" name="mileage" type="number" value={formData.mileage} onChange={handleChange} error={errors.mileage} />
                </div>
                <div style={gridRow}>
                    <FormInput label="Make" name="make" value={formData.make} onChange={handleChange} error={errors.make} placeholder="e.g. BMW" />
                    <FormInput label="Model" name="model" value={formData.model} onChange={handleChange} error={errors.model} placeholder="e.g. M3" />
                </div>
            </FormSection>

            {/* 2. Photos */}
            <FormSection title="Photos" description="Upload clear photos of the exterior, interior, and engine bay.">
                <ImageUploader
                    existingImages={existingImages}
                    newPreviews={previews}
                    onAddFiles={handleFileChange}
                    onRemoveExisting={(id) => {
                        if (confirm("Delete this image?")) {
                            onDeleteImage?.(id);
                            setExistingImages(prev => prev.filter(img => img.id !== id));
                        }
                    }}
                    onRemoveNew={(idx) => {
                        setFiles(prev => prev.filter((_, i) => i !== idx));
                        setPreviews(prev => prev.filter((_, i) => i !== idx));
                    }}
                />
            </FormSection>

            {/* 3. Specs & Description */}
            <FormSection title="Details & Specs" description="The more information you provide, the more trust you build.">
                <FormSelect label="Body Style" name="bodyStyle" value={formData.bodyStyle || ""} onChange={handleChange} options={BODY_STYLES} />
                <div style={gridRow}>
                    <FormSelect label="Transmission" name="transmission" value={formData.transmission || ""} onChange={handleChange} options={TRANSMISSIONS} />
                    <FormSelect label="Drivetrain" name="drivetrain" value={formData.drivetrain || ""} onChange={handleChange} options={DRIVETRAINS} />
                </div>
                <FormInput label="Engine" name="engine" value={formData.engine || ""} onChange={handleChange} placeholder="e.g. V8 Twin Turbo" />

                <div style={{ marginBottom: "20px" }}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        style={textareaStyle}
                        placeholder="Tell bidders what makes this car special..."
                    />
                </div>
            </FormSection>

            {/* 4. Sale Info */}
            <FormSection title="Pricing & Location" description="Set your price and verify title status.">
                <div style={gridRow}>
                    <FormSelect label="Title Status" name="titleStatus" value={formData.titleStatus || ""} onChange={handleChange} options={TITLE_STATUSES} />
                    <FormSelect label="Seller Type" name="sellerType" value={formData.sellerType || ""} onChange={handleChange} options={SELLER_TYPES} />
                </div>
                <div style={gridRow}>
                    <FormInput label="Exterior Color" name="exteriorColor" value={formData.exteriorColor || ""} onChange={handleChange} />
                    <FormInput label="Interior Color" name="interiorColor" value={formData.interiorColor || ""} onChange={handleChange} />
                </div>
                <FormInput label="Location" name="location" value={formData.location} onChange={handleChange} error={errors.location} placeholder="City, State" />
                <FormInput
                    label="Buy It Now Price ($)"
                    name="buyNowPrice"
                    type="number"
                    value={formData.buyNowPrice ?? ""}
                    onChange={handleChange}
                    hint="Optional. Leave blank to only allow bidding."
                />
            </FormSection>

            <button type="submit" disabled={isLoading} style={submitBtnStyle}>
                {isLoading ? "Processing..." : (initialData ? "Update Listing" : "Submit for Approval")}
            </button>
        </form>
    );
};

// --- Styles ---
const gridRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "10px" };
const labelStyle = { display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "14px" };
const textareaStyle = {
    width: "100%", height: "120px", padding: "12px", borderRadius: "6px", border: "1px solid #ddd",
    fontFamily: "inherit", resize: "vertical" as const
};
const submitBtnStyle = {
    marginTop: "20px", width: "100%", padding: "16px", background: "#000", color: "#fff",
    border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer"
};