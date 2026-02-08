import { useState, useEffect, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { ImageUploader } from "./ImageUploader";
import type { ItemCreateRequest, ItemImageDto } from "../types";

// --- Constants ---
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => ({
    value: (currentYear + 1 - i).toString(),
    label: (currentYear + 1 - i).toString()
}));
const BODY_STYLES = ["Sedan", "Coupe", "SUV", "Convertible", "Hatchback", "Wagon", "Truck", "Van", "Motorcycle"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT", "PDK/Dual Clutch"];
const DRIVETRAINS = ["RWD", "FWD", "AWD", "4WD"];

const STEPS = [
    { id: 1, title: "Identity" },
    { id: 2, title: "Specs" },
    { id: 3, title: "Details" },
    { id: 4, title: "Photos" }
];

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

    const [currentStep, setCurrentStep] = useState(1);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        year: currentYear,
        make: "",
        model: "",
        vin: "",
        location: "",
        mileage: "" as number | "",
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

    useEffect(() => {
        return () => previews.forEach(url => URL.revokeObjectURL(url));
    }, [previews]);

    // --- Handlers ---
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
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
        if (!confirm("Remove this photo?")) return;
        setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
        setDeletedImageIds(prev => [...prev, id]);
    };

    // --- Validation ---
    const canProceed = () => {
        if (currentStep === 1) return !!(formData.make && formData.model && formData.year);
        if (currentStep === 2) return !!(formData.mileage !== "" && formData.location && formData.vin.length === 17);
        return true;
    };

    // --- Navigation ---
    const handleNext = (e?: React.MouseEvent | React.KeyboardEvent) => {
        // Stop any form submission events if they triggered this
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (canProceed()) {
            setCurrentStep(p => Math.min(p + 1, STEPS.length));
        }
    };

    const handleBack = () => {
        setCurrentStep(p => Math.max(p - 1, 1));
    };

    // --- Handling "Enter" Key ---
    // This prevents the form from submitting when Enter is pressed on intermediate steps
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Stop default submit
            if (currentStep < STEPS.length) {
                handleNext(e);
            } else {
                // Manually trigger submit if on last step
                requestSubmit();
            }
        }
    };

    // --- Final Submission Logic ---
    const requestSubmit = () => {
        const { images, ...cleanPayload } = formData;
        const keepImageIds = images.filter(img => img.id).map(img => img.id);
        const payload = { ...cleanPayload, keepImageIds };
        onSubmit(payload as ItemCreateRequest, files, deletedImageIds);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // DOUBLE CHECK: If we are not on the last step, DO NOT SUBMIT.
        if (currentStep !== STEPS.length) {
            handleNext();
            return;
        }

        requestSubmit();
    };

    return (
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} style={{width: '100%'}}>

            {/* Progress Bar */}
            <div style={styles.progressTrack}>
                <div style={{...styles.progressBar, width: `${(currentStep / STEPS.length) * 100}%`}} />
            </div>
            <div style={styles.stepHeader}>
                <span style={styles.stepCount}>Step {currentStep} of {STEPS.length}</span>
                <h2 style={styles.stepTitle}>{STEPS[currentStep - 1].title}</h2>
            </div>

            {/* Step Content */}
            <div style={styles.contentArea}>

                {currentStep === 1 && (
                    <div style={styles.grid}>
                        <div style={styles.fullWidth}>
                            <label style={styles.label}>Year</label>
                            <select name="year" value={formData.year} onChange={handleChange} style={styles.select}>
                                {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Make</label>
                            <input name="make" value={formData.make} onChange={handleChange} style={styles.input} placeholder="e.g. Porsche" autoFocus />
                        </div>
                        <div>
                            <label style={styles.label}>Model</label>
                            <input name="model" value={formData.model} onChange={handleChange} style={styles.input} placeholder="e.g. 911 GT3" />
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div style={styles.grid}>
                        <div style={styles.fullWidth}>
                            <label style={styles.label}>VIN (17 Characters)</label>
                            <input name="vin" value={formData.vin} onChange={handleChange} maxLength={17} style={styles.input} placeholder="XXXXXXXXXXXXXXXXX" disabled={isEditMode} autoFocus />
                        </div>
                        <div>
                            <label style={styles.label}>Mileage</label>
                            <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} style={styles.input} placeholder="0" />
                        </div>
                        <div>
                            <label style={styles.label}>Location</label>
                            <input name="location" value={formData.location} onChange={handleChange} style={styles.input} placeholder="City, State" />
                        </div>

                        <div style={styles.fullWidth}>
                            <label style={styles.label}>Transmission</label>
                            <select name="transmission" value={formData.transmission} onChange={handleChange} style={styles.select}>
                                <option value="">Select...</option>
                                {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Body Style</label>
                            <select name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} style={styles.select}>
                                <option value="">Select...</option>
                                {BODY_STYLES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Drivetrain</label>
                            <select name="drivetrain" value={formData.drivetrain} onChange={handleChange} style={styles.select}>
                                <option value="">Select...</option>
                                {DRIVETRAINS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div style={styles.grid}>
                        <div>
                            <label style={styles.label}>Engine</label>
                            <input name="engine" value={formData.engine} onChange={handleChange} style={styles.input} placeholder="e.g. 4.0L Flat-6" autoFocus />
                        </div>
                        <div>
                            <label style={styles.label}>Exterior Color</label>
                            <input name="exteriorColor" value={formData.exteriorColor} onChange={handleChange} style={styles.input} placeholder="e.g. Guards Red" />
                        </div>
                        <div style={styles.fullWidth}>
                            <label style={styles.label}>Interior Color</label>
                            <input name="interiorColor" value={formData.interiorColor} onChange={handleChange} style={styles.input} placeholder="e.g. Black Leather" />
                        </div>
                        <div style={styles.fullWidth}>
                            <label style={styles.label}>Description / Story</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} style={styles.textarea} placeholder="Tell us about the car's history, condition, and any modifications..." />
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div>
                        <ImageUploader
                            existingImages={formData.images}
                            newPreviews={previews}
                            onAddFiles={handleFileChange}
                            onRemoveExisting={handleRemoveExisting}
                            onRemoveNew={handleRemoveNew}
                        />
                        <p style={styles.helperText}>
                            Tip: High-quality photos significantly increase auction engagement.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div style={styles.footer}>
                {currentStep > 1 ? (
                    <button type="button" onClick={handleBack} style={styles.backBtn}>Back</button>
                ) : (
                    onCancel ? <button type="button" onClick={onCancel} style={styles.backBtn}>Cancel</button> : <div />
                )}

                {currentStep < STEPS.length ? (
                    // BUTTON TYPE IS STRICTLY "BUTTON"
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed()}
                        style={canProceed() ? styles.primaryBtn : styles.disabledBtn}
                    >
                        Next Step
                    </button>
                ) : (
                    // BUTTON TYPE IS "SUBMIT" ONLY ON LAST STEP
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={styles.submitBtn}
                    >
                        {isLoading ? "Saving..." : submitLabel}
                    </button>
                )}
            </div>
        </form>
    );
};

// --- Styles ---
const styles = {
    // Progress
    progressTrack: { height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden", marginBottom: "20px" },
    progressBar: { height: "100%", background: "#111", transition: "width 0.3s ease" },
    stepHeader: { marginBottom: "32px" },
    stepCount: { fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    stepTitle: { fontSize: "24px", fontWeight: 700, color: "#111", margin: "4px 0 0 0" },

    // Content Layout
    contentArea: { minHeight: "300px" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    fullWidth: { gridColumn: "1 / -1" },

    // Inputs
    label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" },
    input: { width: "100%", height: "48px", padding: "0 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px", outline: "none", boxSizing: "border-box" as const },
    select: { width: "100%", height: "48px", padding: "0 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px", outline: "none", background: "#fff", cursor: "pointer", boxSizing: "border-box" as const },
    textarea: { width: "100%", height: "120px", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "16px", resize: "vertical" as const, boxSizing: "border-box" as const },

    helperText: { fontSize: "13px", color: "#6b7280", marginTop: "16px", fontStyle: "italic" },

    // Footer
    footer: { display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #f3f4f6" },
    backBtn: { background: "none", border: "none", color: "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    primaryBtn: { background: "#111", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px" },
    disabledBtn: { background: "#e5e7eb", color: "#9ca3af", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "not-allowed", fontSize: "14px" },
    submitBtn: { background: "#16a34a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.2)" }
};