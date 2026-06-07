import { useState, useEffect, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import type { ItemCreateRequest, ItemImageDto, ConditionGrade, ImageCategory } from "../../../entities/item/types";
import { styles } from "./styles";
import { StepIdentity } from "./steps/StepIdentity";
import { StepSpecs } from "./steps/StepSpecs";
import { StepCondition } from "./steps/StepCondition";
import { StepPricing } from "./steps/StepPricing";
import { StepPhotos } from "./steps/StepPhotos";

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

                {currentStep === 1 && <StepIdentity formData={formData} handleChange={handleChange} isEditMode={isEditMode} years={YEARS} />}
                {currentStep === 2 && <StepSpecs formData={formData} handleChange={handleChange} transmissions={TRANSMISSIONS} drivetrains={DRIVETRAINS} fuelTypes={FUEL_TYPES} bodyStyles={BODY_STYLES} />}
                {currentStep === 3 && <StepCondition formData={formData} handleChange={handleChange} conditionGrades={CONDITION_GRADES} titleStatuses={TITLE_STATUSES} />}
                {currentStep === 4 && <StepPricing formData={formData} handleChange={handleChange} />}
                {currentStep === 5 && <StepPhotos formData={formData} previews={previews} handleFileChange={handleFileChange} handleRemoveExisting={handleRemoveExisting} handleRemoveNew={handleRemoveNew} />}
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
