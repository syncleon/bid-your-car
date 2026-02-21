import { useState, useEffect, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { ImageUploader } from "./ImageUploader";
import type { ItemCreateRequest, ItemImageDto, ConditionGrade, ImageCategory } from "../types";

// --- Constants ---
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => ({
    value: (currentYear + 1 - i).toString(),
    label: (currentYear + 1 - i).toString()
}));
const BODY_STYLES = ["Sedan", "Coupe", "SUV", "Convertible", "Hatchback", "Wagon", "Truck", "Van", "Motorcycle"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT", "PDK/Dual Clutch"];
const DRIVETRAINS = ["RWD", "FWD", "AWD", "4WD"];
const FUEL_TYPES = ["Gasoline", "Diesel", "Electric", "Hybrid", "PHEV"];
const TITLE_STATUSES = ["Clean", "Salvage", "Rebuilt", "Lien"];

const CONDITION_GRADES: { value: ConditionGrade; label: string }[] = [
    { value: "EXCELLENT", label: "Excellent (Near-perfect, no visible flaws)" },
    { value: "VERY_GOOD", label: "Very Good (Minor cosmetic blemishes)" },
    { value: "GOOD", label: "Good (Normal wear, mechanically sound)" },
    { value: "FAIR", label: "Fair (Noticeable wear, driveable)" },
    { value: "POOR", label: "Poor (Significant issues)" },
    { value: "PARTS_ONLY", label: "Parts Only (Non-running/Damaged)" },
];

const STEPS = [
    { id: 1, title: "Identity" },
    { id: 2, title: "Specs" },
    { id: 3, title: "Condition & Details" },
    { id: 4, title: "Pricing & Rules" }, // <-- New Step!
    { id: 5, title: "Photos" }           // <-- Shifted to Step 5
];

interface Props {
    initialData?: Partial<ItemCreateRequest> & { images?: ItemImageDto[] };
    // Updated signature to match the Store's requirement for Image Categories
    onSubmit: (data: ItemCreateRequest, filesWithCategories: { file: File, category: ImageCategory }[], deletedImageIds: string[]) => void;
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

        // --- New Fields Initialized ---
        fuelType: "",
        horsepower: "" as number | "",
        condition: "GOOD" as ConditionGrade,
        titleStatus: "Clean",
        isModified: false,
        hasServiceHistory: false,
        reservePrice: "" as number | "",
        isNoReserve: false,

        images: initialData?.images || [],
        ...initialData,
    });

    useEffect(() => {
        return () => previews.forEach(url => URL.revokeObjectURL(url));
    }, [previews]);

    // --- Handlers ---
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Handle checkboxes correctly
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        setFormData(prev => {
            let parsedValue: string | number | boolean = value;

            if (isCheckbox) {
                parsedValue = checked;
            } else if (["mileage", "year", "horsepower", "reservePrice"].includes(name)) {
                parsedValue = value === "" ? "" : Number(value);
            } else if (name === "vin") {
                parsedValue = value.toUpperCase().replace(/[IOQ]/g, '');
            }

            return { ...prev, [name]: parsedValue };
        });
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
        if (currentStep === 1) return !!(formData.make && formData.model && formData.year && formData.vin.length === 17);
        if (currentStep === 2) return !!(formData.mileage !== "" && formData.location);
        if (currentStep === 4) return !!(formData.isNoReserve || (formData.reservePrice !== "" && Number(formData.reservePrice) > 0));
        return true;
    };

    // --- Navigation ---
    const handleNext = (e?: React.MouseEvent | React.KeyboardEvent) => {
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

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'checkbox') {
            e.preventDefault();
            if (currentStep < STEPS.length) {
                handleNext(e);
            } else {
                requestSubmit();
            }
        }
    };

    const requestSubmit = () => {
        const { images, ...rawPayload } = formData;

        // Clean out empty strings to prevent parsing errors on the backend
        const cleanPayload = Object.fromEntries(
            Object.entries(rawPayload).map(([k, v]) => [k, v === "" ? undefined : v])
        );

        // Map files to the new category structure requirement
        // We assume the first uploaded photo is the MAIN thumbnail, the rest are EXTERIOR
        const filesWithCategories = files.map((file, index) => ({
            file,
            category: (index === 0 && images.length === 0) ? "MAIN" as ImageCategory : "EXTERIOR" as ImageCategory
        }));

        const keepImageIds = images.filter(img => img.id).map(img => img.id);
        const payload = { ...cleanPayload, keepImageIds };

        onSubmit(payload as unknown as ItemCreateRequest, filesWithCategories, deletedImageIds);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (currentStep !== STEPS.length) {
            handleNext();
            return;
        }
        requestSubmit();
    };

    return (
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} style={{ width: '100%' }}>

            {/* Progress Bar */}
            <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${(currentStep / STEPS.length) * 100}%` }} />
            </div>
            <div style={styles.stepHeader}>
                <span style={styles.stepCount}>Step {currentStep} of {STEPS.length}</span>
                <h2 style={styles.stepTitle}>{STEPS[currentStep - 1].title}</h2>
            </div>

            {/* Step Content */}
            <div style={styles.contentArea}>

                {currentStep === 1 && (
                    <div style={styles.grid}>
                        <div>
                            <label style={styles.label}>VIN (17 Characters)</label>
                            <input name="vin" value={formData.vin} onChange={handleChange} maxLength={17} style={styles.input} placeholder="XXXXXXXXXXXXXXXXX" disabled={isEditMode} autoFocus />
                        </div>
                        <div>
                            <label style={styles.label}>Year</label>
                            <select name="year" value={formData.year} onChange={handleChange} style={styles.select}>
                                {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                            </select>
                        </div>
                        <div style={styles.halfGrid}>
                            <div>
                                <label style={styles.label}>Make</label>
                                <input name="make" value={formData.make} onChange={handleChange} style={styles.input} placeholder="e.g. Porsche" />
                            </div>
                            <div>
                                <label style={styles.label}>Model</label>
                                <input name="model" value={formData.model} onChange={handleChange} style={styles.input} placeholder="e.g. 911 GT3" />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div style={styles.grid}>
                        <div style={styles.halfGrid}>
                            <div>
                                <label style={styles.label}>Mileage</label>
                                <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} style={styles.input} placeholder="0" autoFocus />
                            </div>
                            <div>
                                <label style={styles.label}>Location</label>
                                <input name="location" value={formData.location} onChange={handleChange} style={styles.input} placeholder="City, State" />
                            </div>
                        </div>

                        <div style={styles.halfGrid}>
                            <div>
                                <label style={styles.label}>Transmission</label>
                                <select name="transmission" value={formData.transmission} onChange={handleChange} style={styles.select}>
                                    <option value="">Select...</option>
                                    {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
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

                        <div style={styles.halfGrid}>
                            <div>
                                <label style={styles.label}>Fuel Type</label>
                                <select name="fuelType" value={formData.fuelType} onChange={handleChange} style={styles.select}>
                                    <option value="">Select...</option>
                                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Horsepower</label>
                                <input type="number" name="horsepower" value={formData.horsepower} onChange={handleChange} style={styles.input} placeholder="e.g. 500" />
                            </div>
                        </div>

                        <div style={styles.halfGrid}>
                            <div>
                                <label style={styles.label}>Body Style</label>
                                <select name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} style={styles.select}>
                                    <option value="">Select...</option>
                                    {BODY_STYLES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Engine Details</label>
                                <input name="engine" value={formData.engine} onChange={handleChange} style={styles.input} placeholder="e.g. 4.0L Flat-6" />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div style={styles.grid}>
                        <div style={styles.halfGrid}>
                            <div>
                                <label style={styles.label}>Condition Grade</label>
                                <select name="condition" value={formData.condition} onChange={handleChange} style={styles.select}>
                                    {CONDITION_GRADES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Title Status</label>
                                <select name="titleStatus" value={formData.titleStatus} onChange={handleChange} style={styles.select}>
                                    {TITLE_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={styles.halfGrid}>
                            <div>
                                <label style={styles.label}>Exterior Color</label>
                                <input name="exteriorColor" value={formData.exteriorColor} onChange={handleChange} style={styles.input} placeholder="e.g. Guards Red" />
                            </div>
                            <div>
                                <label style={styles.label}>Interior Color</label>
                                <input name="interiorColor" value={formData.interiorColor} onChange={handleChange} style={styles.input} placeholder="e.g. Black Leather" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginTop: '8px', marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                <input type="checkbox" name="hasServiceHistory" checked={formData.hasServiceHistory} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                                Includes Service History
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                <input type="checkbox" name="isModified" checked={formData.isModified} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                                Vehicle is Modified
                            </label>
                        </div>

                        <div>
                            <label style={styles.label}>Description & Story</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} style={styles.textarea} placeholder="Tell us about the car's history, flaws, condition, and any modifications..." />
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div style={styles.grid}>
                        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                <input
                                    type="checkbox"
                                    name="isNoReserve"
                                    checked={formData.isNoReserve}
                                    onChange={handleChange}
                                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-success-text)' }}
                                />
                                No Reserve (Sells to the highest bidder!)
                            </label>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0 30px' }}>
                                No Reserve auctions generate significantly more interest and early bidding activity.
                            </p>
                        </div>

                        {!formData.isNoReserve && (
                            <div style={{ marginTop: '12px' }}>
                                <label style={styles.label}>Reserve Price (Minimum acceptable bid)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                                    <input
                                        type="number"
                                        name="reservePrice"
                                        value={formData.reservePrice}
                                        onChange={handleChange}
                                        style={{ ...styles.input, paddingLeft: '28px' }}
                                        placeholder="50000"
                                    />
                                </div>
                                <p style={styles.helperText}>Hidden from buyers. If bidding does not reach this amount, the vehicle will not sell.</p>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 5 && (
                    <div>
                        <ImageUploader
                            existingImages={formData.images}
                            newPreviews={previews}
                            onAddFiles={handleFileChange}
                            onRemoveExisting={handleRemoveExisting}
                            onRemoveNew={handleRemoveNew}
                        />
                        <p style={styles.helperText}>
                            Tip: High-quality photos significantly increase auction engagement. The first image uploaded will be used as the main thumbnail.
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
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed()}
                        style={canProceed() ? styles.primaryBtn : styles.disabledBtn}
                    >
                        Next Step
                    </button>
                ) : (
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
    progressTrack: { height: "4px", background: "var(--bg-input)", borderRadius: "2px", overflow: "hidden", marginBottom: "20px" },
    progressBar: { height: "100%", background: "var(--accent-color)", transition: "width 0.3s ease" },
    stepHeader: { marginBottom: "32px" },
    stepCount: { fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    stepTitle: { fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0 0" },

    contentArea: { minHeight: "300px" },
    grid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" },
    halfGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },

    label: { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" },
    input: { width: "100%", height: "48px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "16px", outline: "none", boxSizing: "border-box" as const, transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease" },
    select: { width: "100%", height: "48px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "16px", outline: "none", cursor: "pointer", boxSizing: "border-box" as const, transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease" },
    textarea: { width: "100%", height: "120px", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "16px", resize: "vertical" as const, boxSizing: "border-box" as const, transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease" },

    helperText: { fontSize: "13px", color: "var(--text-secondary)", marginTop: "16px", fontStyle: "italic" },

    footer: { display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" },
    backBtn: { background: "none", border: "none", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "color 0.2s" },
    primaryBtn: { background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "background-color 0.2s" },
    disabledBtn: { background: "var(--bg-input)", color: "var(--text-muted)", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "not-allowed", fontSize: "14px" },
    submitBtn: { background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)", padding: "12px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "background-color 0.2s" }
};