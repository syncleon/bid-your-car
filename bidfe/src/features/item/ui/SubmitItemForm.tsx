import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { FormInput, FormSection, FormSelect } from "./form-ui";
import { ImageUploader } from "./ImageUploader";
import type { ItemImageDto } from "../types"; // Ensure you have this type defined

// --- Constants ---
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => {
    const y = currentYear + 1 - i;
    return { value: y.toString(), label: y.toString() };
});

const BODY_STYLES = ["Sedan", "Coupe", "SUV", "Convertible", "Hatchback", "Wagon", "Truck", "Van", "Motorcycle"]
    .map(v => ({ value: v, label: v }));

const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT", "PDK/Dual Clutch"]
    .map(v => ({ value: v, label: v }));

const DRIVETRAINS = ["RWD", "FWD", "AWD", "4WD"]
    .map(v => ({ value: v, label: v }));

// --- Types ---
export interface ItemCreateRequest {
    year: number;
    make: string;
    model: string;
    vin: string;
    location: string;
    mileage: number | "";
    description: string;
    engine: string;
    transmission: string;
    drivetrain: string;
    bodyStyle: string;
    exteriorColor: string;
    interiorColor: string;
}

interface Props {
    // initialData might contain 'images' if we are editing
    initialData?: Partial<ItemCreateRequest> & { images?: ItemImageDto[] };
    onSubmit: (data: ItemCreateRequest, files: File[]) => void;
    isLoading: boolean;
}

export const SubmitItemForm = ({ initialData, onSubmit, isLoading }: Props) => {
    // --- Form State ---
    const [formData, setFormData] = useState<ItemCreateRequest>({
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
        ...initialData,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- Image State ---
    // Track existing images from the backend (for edit mode)
    const [existingImages, setExistingImages] = useState<ItemImageDto[]>(initialData?.images || []);
    // Track newly selected files
    const [files, setFiles] = useState<File[]>([]);
    // Track previews for those new files
    const [previews, setPreviews] = useState<string[]>([]);

    // Cleanup previews on unmount
    useEffect(() => {
        return () => previews.forEach(url => URL.revokeObjectURL(url));
    }, [previews]);

    // --- Handlers ---

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));

        setFormData(prev => ({
            ...prev,
            [name]: name === "mileage" || name === "year"
                ? (value === "" ? "" : Number(value))
                : name === "vin" ? value.toUpperCase()
                    : value
        }));
    };

    // 1. Add New Files
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
            setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
        }
    };

    // 2. Remove New File (Client-side only)
    const handleRemoveNew = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]); // Free memory
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };

    // 3. Remove Existing File (From server data)
    const handleRemoveExisting = (id: string) => {
        if(confirm("Are you sure you want to remove this photo?")) {
            setExistingImages(prev => prev.filter(img => img.id !== id));
            // NOTE: If your API requires deleting images immediately, call that API here.
            // If your API handles deletion upon form submission, you need to track which IDs were deleted.
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.make) newErrors.make = "Make is required";
        if (!formData.model) newErrors.model = "Model is required";
        if (!formData.location) newErrors.location = "Location is required";
        if (formData.vin.length < 17) newErrors.vin = "VIN must be 17 characters";
        if (formData.mileage === "") newErrors.mileage = "Mileage is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) {
            // Note: You might need to pass the 'existingImages' state to your onSubmit
            // if you need to tell the backend which old images to KEEP.
            onSubmit(formData, files);
        } else {
            alert("Please fix the errors before submitting.");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "80px" }}>

            {/* Inject CSS to hide number spinners */}
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            <FormSection title="Vehicle Identity" description="Basic details to identify the car.">
                <FormInput
                    label="VIN"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    maxLength={17}
                    error={errors.vin}
                    hint="17 characters (Dashboard/Door Jamb)"
                    placeholder="WBA..."
                />

                <FormSelect
                    label="Year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    options={YEARS}
                />

                <FormInput
                    label="Make"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    error={errors.make}
                    placeholder="e.g. Porsche"
                />

                <FormInput
                    label="Model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    error={errors.model}
                    placeholder="e.g. 911 Carrera S"
                />

                <FormInput
                    label="Mileage"
                    name="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={handleChange}
                    error={errors.mileage}
                    placeholder="Odometer reading"
                />

                <FormInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={errors.location}
                    placeholder="City, State"
                />
            </FormSection>

            <FormSection title="Specifications" description="Technical details buyers care about.">
                <FormSelect
                    label="Body Style"
                    name="bodyStyle"
                    value={formData.bodyStyle}
                    onChange={handleChange}
                    options={BODY_STYLES}
                />

                <FormSelect
                    label="Transmission"
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    options={TRANSMISSIONS}
                />

                <FormSelect
                    label="Drivetrain"
                    name="drivetrain"
                    value={formData.drivetrain}
                    onChange={handleChange}
                    options={DRIVETRAINS}
                />

                <FormInput
                    label="Engine"
                    name="engine"
                    value={formData.engine}
                    onChange={handleChange}
                    placeholder="e.g. 3.0L Flat-6 Twin Turbo"
                />

                <FormInput
                    label="Exterior Color"
                    name="exteriorColor"
                    value={formData.exteriorColor}
                    onChange={handleChange}
                    placeholder="Factory paint name"
                />

                <FormInput
                    label="Interior Color"
                    name="interiorColor"
                    value={formData.interiorColor}
                    onChange={handleChange}
                    placeholder="e.g. Black Leather"
                />
            </FormSection>

            {/* Description */}
            <div style={{ marginBottom: "40px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px", color: "#1e293b" }}>Story & Condition</h3>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    style={{
                        width: "100%",
                        padding: "16px",
                        borderRadius: "8px",
                        borderColor: "#e2e8f0",
                        fontSize: "15px",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        resize: "vertical"
                    }}
                    placeholder="Tell the story of the car. Mention service history, modifications, and any known flaws..."
                />
            </div>

            {/* Photos - Replaced with the new ImageUploader */}
            <div style={{ marginBottom: "40px" }}>
                <ImageUploader
                    existingImages={existingImages}
                    newPreviews={previews}
                    onAddFiles={handleFileChange}
                    onRemoveExisting={handleRemoveExisting}
                    onRemoveNew={handleRemoveNew}
                />
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        backgroundColor: "#1e293b",
                        color: "white",
                        padding: "14px 32px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: 600,
                        border: "none",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? "Submitting..." : "Submit Listing"}
                </button>
            </div>

        </form>
    );
};