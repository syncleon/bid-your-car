import { useState, useEffect, type ChangeEvent } from "react";
import type { ItemSubmitRequest, ItemDto, ItemImageDto } from "../types"; // ✅ Added ItemImageDto
import { FormInput, FormSelect, FormSection } from "./form-components";

// Predefined Options
const BODY_STYLES = [
    { value: "Sedan", label: "Sedan" },
    { value: "Coupe", label: "Coupe" },
    { value: "SUV", label: "SUV" },
    { value: "Convertible", label: "Convertible" },
    { value: "Hatchback", label: "Hatchback" },
    { value: "Wagon", label: "Wagon" },
    { value: "Truck", label: "Truck" },
    { value: "Van", label: "Van" }
];

const TRANSMISSIONS = [
    { value: "Automatic", label: "Automatic" },
    { value: "Manual", label: "Manual" },
    { value: "CVT", label: "CVT" },
    { value: "DCT", label: "DCT" }
];

const DRIVETRAINS = [
    { value: "RWD", label: "Rear-Wheel Drive (RWD)" },
    { value: "FWD", label: "Front-Wheel Drive (FWD)" },
    { value: "AWD", label: "All-Wheel Drive (AWD)" },
    { value: "4WD", label: "Four-Wheel Drive (4WD)" }
];

const SELLER_TYPES = [
    { value: "Private Party", label: "Private Party" },
    { value: "Dealer", label: "Dealership" }
];

interface Props {
    initialData?: ItemDto;
    onSubmit: (data: ItemSubmitRequest, files: File[]) => void;
    // ✅ NEW: Optional callback for deleting server images (only for Edit mode)
    onDeleteImage?: (imageId: string) => void;
    isLoading: boolean;
}

export const SubmitItemForm = ({ initialData, onSubmit, onDeleteImage, isLoading }: Props) => {

    // --- 1. Form Data State ---
    const initial = (key: keyof ItemSubmitRequest, fallback: string | number | null = "") => {
        if (!initialData) return fallback;
        return (initialData as any)[key] ?? fallback;
    };

    const [formData, setFormData] = useState<ItemSubmitRequest>({
        make: initial("make") as string,
        model: initial("model") as string,
        vin: initial("vin") as string,
        location: initial("location") as string,
        buyNowPrice: initial("buyNowPrice", null) as number | null,
        engine: initial("engine") as string,
        transmission: initial("transmission") as string,
        drivetrain: initial("drivetrain") as string,
        bodyStyle: initial("bodyStyle") as string,
        exteriorColor: initial("exteriorColor") as string,
        interiorColor: initial("interiorColor") as string,
        sellerType: initial("sellerType") as string,
    });

    const [existingImages, setExistingImages] = useState<ItemImageDto[]>(
        initialData?.images || []
    );

    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        if (initialData?.images) {
            setExistingImages(initialData.images);
        }
    }, [initialData]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            previews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previews]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "buyNowPrice"
                ? (value === "" ? null : Number(value))
                : value,
        }));
    };

    // Handle Selecting NEW Files
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
            const newUrls = newFiles.map((file) => URL.createObjectURL(file));
            setPreviews((prev) => [...prev, ...newUrls]);
        }
    };

    // Remove a NEW file (Local only)
    const handleRemoveNewFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // ✅ Remove an EXISTING image (Server side)
    const handleRemoveExistingImage = (imageId: string) => {
        if (onDeleteImage) {
            // 1. Call parent handler (triggers API)
            onDeleteImage(imageId);
            // 2. Optimistically remove from UI
            setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData, files);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "40px" }}>

            {/* Section 1: Essentials */}
            <FormSection title="Vehicle Essentials">
                <FormInput
                    label="VIN"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    required
                    maxLength={17}
                    placeholder="e.g. 1HGCM82633A..."
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <FormInput
                        label="Make"
                        name="make"
                        value={formData.make}
                        onChange={handleChange}
                        required
                        placeholder="e.g. BMW"
                    />
                    <FormInput
                        label="Model"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        required
                        placeholder="e.g. M3"
                    />
                </div>
                <FormSelect
                    label="Body Style"
                    name="bodyStyle"
                    value={formData.bodyStyle || ""}
                    onChange={handleChange}
                    options={BODY_STYLES}
                />
            </FormSection>

            {/* ✅ UPDATED Section: Photos */}
            <FormSection title="Photos">
                <div style={styles.uploadContainer}>
                    <p style={styles.uploadHint}>
                        Add photos of the exterior, interior, and engine bay.
                    </p>

                    <label style={styles.uploadButton}>
                        + Add Photos
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />
                    </label>

                    <div style={styles.grid}>
                        {/* A. EXISTING IMAGES (From Server) */}
                        {existingImages.map((img) => (
                            <div key={img.id} style={styles.previewWrapper}>
                                <img
                                    src={img.thumbnailUrl}
                                    alt="existing"
                                    style={styles.previewImg}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(img.id)}
                                    style={{ ...styles.removeBtn, background: "#dc2626" }} // Red for delete
                                    title="Delete from server"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}

                        {/* B. NEW PREVIEWS (Pending Upload) */}
                        {previews.map((url, index) => (
                            <div key={url} style={styles.previewWrapper}>
                                <img
                                    src={url}
                                    alt={`New ${index}`}
                                    style={styles.previewImg}
                                />
                                <div style={styles.newBadge}>New</div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveNewFile(index)}
                                    style={styles.removeBtn}
                                    title="Remove upload"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </FormSection>

            {/* Section 2: Technical Specifications */}
            <FormSection title="Technical Specifications">
                <FormInput
                    label="Engine"
                    name="engine"
                    value={formData.engine || ""}
                    onChange={handleChange}
                    placeholder="e.g. 3.0L Twin-Turbo"
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <FormSelect
                        label="Transmission"
                        name="transmission"
                        value={formData.transmission || ""}
                        onChange={handleChange}
                        options={TRANSMISSIONS}
                    />
                    <FormSelect
                        label="Drivetrain"
                        name="drivetrain"
                        value={formData.drivetrain || ""}
                        onChange={handleChange}
                        options={DRIVETRAINS}
                    />
                </div>
            </FormSection>

            {/* Section 3: Colors & Location */}
            <FormSection title="Appearance & Location">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <FormInput
                        label="Exterior Color"
                        name="exteriorColor"
                        value={formData.exteriorColor || ""}
                        onChange={handleChange}
                        placeholder="e.g. Alpine White"
                    />
                    <FormInput
                        label="Interior Color"
                        name="interiorColor"
                        value={formData.interiorColor || ""}
                        onChange={handleChange}
                        placeholder="e.g. Black"
                    />
                </div>
                <FormInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="City, State, Zip"
                />
            </FormSection>

            {/* Section 4: Sale Info */}
            <FormSection title="Sale Details">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <FormInput
                        label="Buy Now Price ($)"
                        name="buyNowPrice"
                        type="number"
                        value={formData.buyNowPrice ?? ""}
                        onChange={handleChange}
                        placeholder="0.00"
                    />
                    <FormSelect
                        label="Seller Type"
                        name="sellerType"
                        value={formData.sellerType || ""}
                        onChange={handleChange}
                        options={SELLER_TYPES}
                    />
                </div>
            </FormSection>

            <button
                type="submit"
                disabled={isLoading}
                style={{
                    ...styles.submitBtn,
                    background: isLoading ? "#9ca3af" : "#000",
                    cursor: isLoading ? "not-allowed" : "pointer",
                }}
            >
                {isLoading ? "Processing..." : (initialData ? "Save Changes" : "Publish Listing")}
            </button>
        </form>
    );
};

// --- Styles ---
const styles = {
    uploadContainer: {
        border: "1px dashed #d1d5db",
        borderRadius: "8px",
        padding: "20px",
        background: "#f9fafb",
    },
    uploadHint: {
        fontSize: "14px",
        color: "#6b7280",
        marginBottom: "12px",
    },
    uploadButton: {
        display: "inline-block",
        padding: "8px 16px",
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#374151",
        cursor: "pointer",
        marginBottom: "16px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "12px",
    },
    previewWrapper: {
        position: "relative" as const,
        width: "100%",
        aspectRatio: "4/3",
        borderRadius: "6px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        background: "#fff",
    },
    previewImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
    },
    // Standard remove button (gray)
    removeBtn: {
        position: "absolute" as const,
        top: "4px",
        right: "4px",
        width: "24px",
        height: "24px",
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "14px",
        zIndex: 2,
    },
    newBadge: {
        position: "absolute" as const,
        bottom: "4px",
        left: "4px",
        background: "#059669", // Green
        color: "white",
        fontSize: "10px",
        padding: "2px 6px",
        borderRadius: "4px",
        fontWeight: "bold",
        zIndex: 2
    },
    submitBtn: {
        marginTop: "16px",
        padding: "16px",
        borderRadius: "8px",
        border: "none",
        color: "#fff",
        fontSize: "16px",
        fontWeight: 700,
        width: "100%",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
    }
};