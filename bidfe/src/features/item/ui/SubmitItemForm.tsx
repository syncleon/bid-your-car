import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import type { ItemCreateRequest, ItemDto, ItemImageDto } from "../types";
import { FormInput, FormSelect } from "./form-ui";
import { ImageUploader } from "./ImageUploader";

// --- Constants & Helpers ---

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1899 }, (_, i) => {
    const y = currentYear + 1 - i;
    return { value: y.toString(), label: y.toString() };
});

const BODY_STYLES = ["Sedan", "Coupe", "SUV", "Convertible", "Hatchback", "Wagon", "Truck", "Van", "Motorcycle"].map(v => ({ value: v, label: v }));
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT", "PDK/Dual Clutch"].map(v => ({ value: v, label: v }));
const DRIVETRAINS = ["RWD (Rear Wheel Drive)", "FWD (Front Wheel Drive)", "AWD (All Wheel Drive)", "4WD (Four Wheel Drive)"].map(v => ({ value: v.split(" ")[0], label: v }));
const SELLER_TYPES = [{ value: "Private Party", label: "Private Party (I own the title)" }, { value: "Dealer", label: "Dealership (Business)" }];

interface Props {
    initialData?: ItemDto;
    onSubmit: (data: ItemCreateRequest, files: File[]) => void;
    onDeleteImage?: (imageId: string) => void;
    isLoading: boolean;
}

export const SubmitItemForm = ({ initialData, onSubmit, onDeleteImage, isLoading }: Props) => {

    // --- State Logic ---
    const initial = (key: keyof ItemCreateRequest, fallback: any = "") =>
        initialData ? (initialData as any)[key] ?? fallback : fallback;

    const [formData, setFormData] = useState<ItemCreateRequest>({
        year: initial("year", currentYear),
        make: initial("make"),
        model: initial("model"),
        vin: initial("vin"),
        location: initial("location"),
        mileage: initial("mileage", ""), // Start empty string to avoid "0"
        description: initial("description"),
        engine: initial("engine"),
        transmission: initial("transmission"),
        drivetrain: initial("drivetrain"),
        bodyStyle: initial("bodyStyle"),
        exteriorColor: initial("exteriorColor"),
        interiorColor: initial("interiorColor"),
        sellerType: initial("sellerType"),
    });

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
            [name]: name === "mileage" || name === "year"
                ? (value === "" ? "" : Number(value)) // Handle empty string vs number
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

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.vin || formData.vin.length !== 17) newErrors.vin = "Please enter a valid 17-character VIN.";
        if (!formData.make) newErrors.make = "Make is required.";
        if (!formData.model) newErrors.model = "Model is required.";
        if (!formData.location) newErrors.location = "City and State are required.";
        if (!formData.mileage) newErrors.mileage = "Mileage is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (validate()) onSubmit(formData, files);
    };

    return (
        <form onSubmit={handleSubmit} style={styles.container}>

            {/* Inject CSS to hide spinners on number inputs */}
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            <div style={styles.header}>
                <h3 style={styles.title}>{initialData ? "Update Vehicle" : "List Your Vehicle"}</h3>
                <p style={styles.subtitle}>Let's get the details right so buyers can trust your listing.</p>
            </div>

            {/* SECTION 1: IDENTITY */}
            <div style={styles.sectionHeader}>Basic Identity</div>
            <div style={styles.grid3}>
                <div style={styles.fieldWrapper}>
                    <FormInput
                        label="VIN"
                        name="vin"
                        value={formData.vin}
                        onChange={handleChange}
                        maxLength={17}
                        error={errors.vin}
                        placeholder="17 chars (Dashboard/Door Jamb)"
                    />
                    <div style={styles.helperText}>Used to verify factory specs.</div>
                </div>

                <div style={styles.fieldWrapper}>
                    <FormSelect
                        label="Model Year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        options={YEARS}
                    />
                </div>

                <div style={styles.fieldWrapper}>
                    {/* Mileage: Number input, but visually clean (no spinners) */}
                    <FormInput
                        label="Current Mileage"
                        name="mileage"
                        type="number"
                        value={formData.mileage}
                        onChange={handleChange}
                        error={errors.mileage}
                        placeholder="e.g. 45000"
                    />
                    <div style={styles.helperText}>Exact odometer reading.</div>
                </div>

                <FormInput label="Make" name="make" value={formData.make} onChange={handleChange} error={errors.make} placeholder="e.g. BMW" />
                <FormInput label="Model" name="model" value={formData.model} onChange={handleChange} error={errors.model} placeholder="e.g. M3 Competition" />

                <div style={styles.fieldWrapper}>
                    <FormInput
                        label="Vehicle Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        error={errors.location}
                        placeholder="City, State (Zip Optional)"
                    />
                </div>
            </div>

            <div style={styles.divider} />

            {/* SECTION 2: SPECS */}
            <div style={styles.sectionHeader}>Specifications</div>
            <div style={styles.grid4}>
                <FormSelect label="Body Style" name="bodyStyle" value={formData.bodyStyle || ""} onChange={handleChange} options={BODY_STYLES} />
                <FormSelect label="Transmission" name="transmission" value={formData.transmission || ""} onChange={handleChange} options={TRANSMISSIONS} />
                <FormSelect label="Drivetrain" name="drivetrain" value={formData.drivetrain || ""} onChange={handleChange} options={DRIVETRAINS} />
                <FormSelect label="Who are you?" name="sellerType" value={formData.sellerType || ""} onChange={handleChange} options={SELLER_TYPES} />

                <FormInput label="Engine Details" name="engine" value={formData.engine || ""} onChange={handleChange} placeholder="e.g. 3.0L Twin-Turbo Inline-6" />
                <FormInput label="Exterior Color" name="exteriorColor" value={formData.exteriorColor || ""} onChange={handleChange} placeholder="Factory paint name" />
                <FormInput label="Interior Color" name="interiorColor" value={formData.interiorColor || ""} onChange={handleChange} placeholder="e.g. Black Leather" />
                <div />
            </div>

            <div style={styles.divider} />

            {/* SECTION 3: STORY */}
            <div style={{ marginBottom: 24 }}>
                <label style={styles.label}>Tell the car's story</label>
                <div style={styles.helperText}>
                    Be honest. Mention upgrades, service history, known flaws, and ownership history.
                </div>
                <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    style={styles.textarea}
                    placeholder="Example: I am the second owner of this 911. It has been garage-kept and dealer-serviced its whole life. Recent maintenance includes..."
                />
            </div>

            {/* SECTION 4: VISUALS */}
            <div style={{ marginBottom: 32 }}>
                <label style={styles.label}>Photo Gallery</label>
                <div style={{...styles.helperText, marginBottom: "12px"}}>
                    High-quality landscape photos get higher bids. Add at least 5 photos.
                </div>
                <ImageUploader
                    existingImages={existingImages}
                    newPreviews={previews}
                    onAddFiles={handleFileChange}
                    onRemoveExisting={(id) => {
                        if (confirm("Remove this photo?")) { onDeleteImage?.(id); setExistingImages(prev => prev.filter(img => img.id !== id)); }
                    }}
                    onRemoveNew={(idx) => {
                        setFiles(prev => prev.filter((_, i) => i !== idx));
                        setPreviews(prev => prev.filter((_, i) => i !== idx));
                    }}
                />
            </div>

            <div style={styles.footer}>
                <button type="submit" disabled={isLoading} style={styles.submitBtn}>
                    {isLoading ? "Processing..." : "Submit Listing"}
                </button>
            </div>
        </form>
    );
};

// --- Styles ---
const styles = {
    container: {
        maxWidth: "900px",
        margin: "0 auto",
        padding: "0 20px 80px 20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    header: { marginBottom: "32px" },
    title: { fontSize: "24px", fontWeight: 600, margin: "0 0 8px 0", letterSpacing: "-0.5px", color: "#111" },
    subtitle: { fontSize: "15px", color: "#666", margin: 0 },

    // Tiny Section Headers to group content visually without boxes
    sectionHeader: {
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "1px",
        color: "#999",
        marginBottom: "16px",
        marginTop: "10px"
    },
    divider: { height: "1px", backgroundColor: "#eee", margin: "40px 0 24px 0" },

    // Grid
    grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px 20px" },
    grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px 20px" },

    fieldWrapper: { display: "flex", flexDirection: "column" as const },

    label: { display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "#333" },

    // New Helper Text Style
    helperText: { fontSize: "12px", color: "#888", marginTop: "4px", lineHeight: "1.4" },

    textarea: {
        width: "100%", minHeight: "140px", padding: "14px", borderRadius: "6px",
        border: "1px solid #e0e0e0", fontSize: "15px", lineHeight: "1.6",
        resize: "vertical" as const, outline: "none", backgroundColor: "#fafafa", marginTop: "8px"
    },
    footer: { display: "flex", justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: "24px" },
    submitBtn: {
        padding: "14px 40px", background: "#111", color: "#fff", border: "none",
        borderRadius: "6px", fontWeight: 600, fontSize: "15px", cursor: "pointer",
        transition: "opacity 0.2s", boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
    }
};