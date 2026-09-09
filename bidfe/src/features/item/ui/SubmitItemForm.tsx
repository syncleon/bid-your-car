import { useState, useEffect, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { VehicleSelect } from "./VehicleSelect";
import { ConfirmDialog } from "../../../shared/ui/dialog/ConfirmDialog";
import { LiveListingPreview } from "./LiveListingPreview";
import type { ItemCreateRequest, ItemImageDto, ConditionGrade, ImageCategory } from "../types";
import "./SubmitItemForm.css";

const currentYear = new Date().getFullYear();

const BODY_STYLES = [
    { value: "Sedan", label: "Sedan" }, { value: "Coupe", label: "Coupe" }, { value: "SUV", label: "SUV" }, 
    { value: "Convertible", label: "Convertible" }, { value: "Hatchback", label: "Hatchback" }, 
    { value: "Wagon", label: "Wagon" }, { value: "Truck", label: "Truck" }, { value: "Van", label: "Van" }, 
    { value: "Motorcycle", label: "Motorcycle" }
];
const TRANSMISSIONS = [
    { value: "Automatic", label: "Automatic" }, { value: "Manual", label: "Manual" }, 
    { value: "CVT", label: "CVT" }, { value: "DCT", label: "DCT" }, { value: "PDK/Dual Clutch", label: "PDK/Dual Clutch" }
];
const DRIVETRAINS = [
    { value: "RWD", label: "RWD" }, { value: "FWD", label: "FWD" }, 
    { value: "AWD", label: "AWD" }, { value: "4WD", label: "4WD" }
];
const FUEL_TYPES = [
    { value: "Gasoline", label: "Gasoline" }, { value: "Diesel", label: "Diesel" }, 
    { value: "Electric", label: "Electric" }, { value: "Hybrid", label: "Hybrid" }, { value: "PHEV", label: "PHEV" }
];
const TITLE_STATUSES = [
    { value: "Clean", label: "Clean" }, { value: "Salvage", label: "Salvage" }, 
    { value: "Rebuilt", label: "Rebuilt" }, { value: "Lien", label: "Lien" }
];

const CONDITION_GRADES: { value: ConditionGrade; label: string; desc: string }[] = [
    { value: "EXCELLENT", label: "Excellent", desc: "Near-perfect, no visible flaws" },
    { value: "VERY_GOOD", label: "Very Good", desc: "Minor cosmetic blemishes" },
    { value: "GOOD", label: "Good", desc: "Normal wear, mechanically sound" },
    { value: "FAIR", label: "Fair", desc: "Noticeable wear, driveable" },
    { value: "POOR", label: "Poor", desc: "Significant issues" },
    { value: "PARTS_ONLY", label: "Parts Only", desc: "Non-running/Damaged" },
];

const toTitleCase = (str: string) => {
    return str.replace(
        /\b\w+/g,
        function(txt) {
            const upper = txt.toUpperCase();
            if (['BMW', 'GMC', 'VW', 'FIAT', 'AMG', 'SSC', 'SCG'].includes(upper)) return upper;
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
};

const TOTAL_STEPS = 8;

const COMMON_MAKES = new Set([
    "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", 
    "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ferrari", "FIAT", 
    "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", 
    "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", 
    "Mazda", "McLaren", "Mercedes-Benz", "MINI", "Mitsubishi", "Nissan", 
    "Pagani", "Polestar", "Porsche", "Ram", "Rolls-Royce", "Subaru", "Suzuki", 
    "Tesla", "Toyota", "Volkswagen", "Volvo", "Smart", "Rivian", "Lucid", "Maybach",
    "Saab", "Pontiac", "Saturn", "Oldsmobile", "Mercury", "Hummer", "Scion", "Fisker", "DeLorean"
].map(m => m.toLowerCase()));

const ChipGroup = ({ options, value, onChange, name }: { options: {value: string, label: string, desc?: string}[], value: string, onChange: (e: any) => void, name: string }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((opt) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ target: { name, value: opt.value, type: 'text' } } as any)}
                style={{
                    padding: opt.desc ? '10px 16px' : '8px 16px',
                    borderRadius: opt.desc ? '16px' : '24px',
                    border: value === opt.value ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)',
                    background: value === opt.value ? 'var(--accent-color)' : 'rgba(255,255,255,0.02)',
                    color: value === opt.value ? '#fff' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    textAlign: 'left'
                }}
            >
                <span style={{ fontWeight: value === opt.value ? 600 : 500, fontSize: '14px', whiteSpace: 'nowrap' }}>{opt.label}</span>
                {opt.desc && <span style={{ fontSize: '12px', opacity: value === opt.value ? 0.9 : 0.5, whiteSpace: 'nowrap' }}>{opt.desc}</span>}
            </button>
        ))}
    </div>
);

const FormLabel = ({ title, desc }: { title: string, desc?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{title}</label>
        {desc && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{desc}</span>}
    </div>
);

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
    const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, targetId: string | null}>({ isOpen: false, targetId: null });

    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [loadingMakes, setLoadingMakes] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

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
        fuelType: "",
        horsepower: "" as number | "",
        condition: "GOOD" as ConditionGrade,
        titleStatus: "Clean",
        isModified: false,
        hasServiceHistory: false,
        images: initialData?.images || [],
        ...initialData,
    });

    useEffect(() => {
        return () => previews.forEach(url => URL.revokeObjectURL(url));
    }, [previews]);

    useEffect(() => {
        if (currentStep === 2 && makes.length === 0) {
            const cachedMakes = localStorage.getItem('nhtsa_makes');
            if (cachedMakes) {
                setMakes(JSON.parse(cachedMakes));
                return;
            }

            setLoadingMakes(true);
            fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json')
                .then(res => res.json())
                .then(data => {
                    if (data && data.Results) {
                        const allMakes = data.Results.map((item: any) => toTitleCase(item.MakeName));
                        const filteredMakes = allMakes.filter((m: string) => COMMON_MAKES.has(m.toLowerCase()));
                        const sortedMakes = filteredMakes.sort();
                        setMakes(sortedMakes);
                        localStorage.setItem('nhtsa_makes', JSON.stringify(sortedMakes));
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingMakes(false));
        }
    }, [currentStep, makes.length]);

    useEffect(() => {
        if (formData.make && formData.year && formData.year.toString().length === 4) {
            const cacheKey = `nhtsa_models_${formData.make}_${formData.year}`;
            const cachedModels = localStorage.getItem(cacheKey);
            
            if (cachedModels) {
                setModels(JSON.parse(cachedModels));
                return;
            }

            setLoadingModels(true);
            fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${formData.make}/modelyear/${formData.year}?format=json`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.Results) {
                        const parsedModels = data.Results.map((item: any) => toTitleCase(item.Model_Name)).sort();
                        setModels(parsedModels);
                        localStorage.setItem(cacheKey, JSON.stringify(parsedModels));
                    } else {
                        setModels([]);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingModels(false));
        } else {
            setModels([]);
        }
    }, [formData.make, formData.year]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: string; type?: string; } }) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        setFormData(prev => {
            let parsedValue: string | number | boolean = value;
            if (isCheckbox) {
                parsedValue = checked;
            } else if (["mileage", "year", "horsepower"].includes(name)) {
                parsedValue = value === "" ? "" : Number(value);
            } else if (name === "vin") {
                parsedValue = value.toUpperCase().replace(/[IOQ]/g, '');
            }
            
            const updates: any = { [name]: parsedValue };
            
            // Clear model if make changes
            if (name === 'make' && prev.make !== parsedValue) {
                updates.model = '';
            }
            
            return { ...prev, ...updates };
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

    const handleRemoveExisting = (id: string) => setConfirmDialog({ isOpen: true, targetId: id });

    const confirmRemoveExisting = () => {
        const id = confirmDialog.targetId;
        if (id) {
            setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
            setDeletedImageIds(prev => [...prev, id]);
        }
        setConfirmDialog({ isOpen: false, targetId: null });
    };

    const canProceed = () => {
        if (currentStep === 1) return formData.vin.length === 17;
        if (currentStep === 2) return !!(formData.make && formData.model && formData.year);
        if (currentStep === 3) return !!(formData.transmission && formData.drivetrain && formData.fuelType);
        if (currentStep === 4) return !!(formData.bodyStyle && formData.exteriorColor && formData.interiorColor);
        if (currentStep === 5) return !!(formData.condition && formData.titleStatus);
        if (currentStep === 6) return !!(formData.mileage !== "" && formData.location);
        if (currentStep === 8) return true;
        return true;
    };

    const changeStep = (newStep: number) => {
        if (!document.startViewTransition) {
            setCurrentStep(newStep);
            return;
        }

        const isForward = newStep > currentStep;
        document.documentElement.classList.remove('going-forward', 'going-backward');
        document.documentElement.classList.add(isForward ? 'going-forward' : 'going-backward');

        const transition = document.startViewTransition(() => {
            setCurrentStep(newStep);
        });

        transition.finished.finally(() => {
            document.documentElement.classList.remove('going-forward', 'going-backward');
        });
    };

    const handleNext = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (canProceed()) changeStep(Math.min(currentStep + 1, TOTAL_STEPS));
    };

    const handleBack = () => {
        changeStep(Math.max(currentStep - 1, 1));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'checkbox') {
            e.preventDefault();
        }
    };

    const requestSubmit = () => {
        const { images, ...rawPayload } = formData;
        const cleanPayload = Object.fromEntries(
            Object.entries(rawPayload).map(([k, v]) => [k, v === "" ? undefined : v])
        );
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
        if (currentStep !== TOTAL_STEPS) { handleNext(); return; }
        requestSubmit();
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "Vehicle Identification";
            case 2: return "Basic Information";
            case 3: return "Powertrain";
            case 4: return "Body & Colors";
            case 5: return "Condition & Title";
            case 6: return "History & Location";
            case 7: return "Story & Description";
            case 8: return "Reserve Price";
            case 9: return "Photography";
            default: return "";
        }
    };



    return (
        <div className="submit-form-layout">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="submit-form-card">
            
            {/* Modern Attractive Progress Bar */}
            <div className="modern-progress-container">
                <div 
                    className="modern-progress-fill" 
                    style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                />
            </div>

            <div className="form-step-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h2 className="step-title" style={{ margin: 0 }}>{getStepTitle()}</h2>
                </div>

                {currentStep === 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <FormLabel title="17-digit VIN" desc="Found on the driver's side dashboard or door jamb." />
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input name="vin" value={formData.vin} onChange={handleChange} maxLength={17} className="modern-input standard-input" style={{ fontSize: '20px', letterSpacing: '2px', textTransform: 'uppercase', width: '100%', paddingRight: '48px'}} placeholder="e.g. WBA00000000000000" disabled={isEditMode} autoFocus />
                                    {formData.vin.length === 17 && (
                                        <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', pointerEvents: 'none' }}>
                                            <ShieldCheck size={24} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Year" desc="Model year." />
                            <input type="number" name="year" value={formData.year} onChange={handleChange} className="modern-input standard-input" min="1900" max={new Date().getFullYear() + 1} placeholder="e.g. 2024" />
                        </div>
                        <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Make" desc="Manufacturer." />
                            <VehicleSelect name="make" value={formData.make} onChange={handleChange} options={makes} loading={loadingMakes} placeholder="Select Make" />
                        </div>
                        <div style={{ zIndex: 9, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Model" desc="Specific model name." />
                            <VehicleSelect name="model" value={formData.model} onChange={handleChange} options={models} loading={loadingModels} disabled={!formData.make} placeholder={!formData.make ? "Select Make first..." : "Select Model"} />
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <FormLabel title="Transmission" desc="How the car changes gears." />
                                <ChipGroup name="transmission" value={formData.transmission} onChange={handleChange} options={TRANSMISSIONS} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <FormLabel title="Drivetrain" desc="Which wheels receive power from the engine." />
                                <ChipGroup name="drivetrain" value={formData.drivetrain} onChange={handleChange} options={DRIVETRAINS} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <FormLabel title="Fuel Type" desc="What type of energy powers the vehicle." />
                                <ChipGroup name="fuelType" value={formData.fuelType} onChange={handleChange} options={FUEL_TYPES} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Engine Details (Optional)" desc="Specify engine size and configuration." />
                                <input name="engine" value={formData.engine} onChange={handleChange} className="modern-input standard-input" placeholder="e.g. 4.0L Flat-6" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Horsepower (Optional)" desc="Factory rated or dyno-tested output." />
                                <input type="number" name="horsepower" value={formData.horsepower} onChange={handleChange} className="modern-input standard-input" placeholder="e.g. 500" />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <FormLabel title="Body Style" desc="The general shape and configuration of the vehicle." />
                            <ChipGroup name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} options={BODY_STYLES} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Exterior Color" desc="Primary exterior color of the vehicle." />
                                <input name="exteriorColor" value={formData.exteriorColor} onChange={handleChange} className="modern-input standard-input" placeholder="e.g. Guards Red" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Interior Color" desc="Primary interior color and material." />
                                <input name="interiorColor" value={formData.interiorColor} onChange={handleChange} className="modern-input standard-input" placeholder="e.g. Black" />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <FormLabel title="Condition" desc="Honest assessment of the vehicle's current state." />
                            <ChipGroup name="condition" value={formData.condition} onChange={handleChange} options={CONDITION_GRADES} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <FormLabel title="Title Status" desc="Legal status of the vehicle's ownership document." />
                            <ChipGroup name="titleStatus" value={formData.titleStatus} onChange={handleChange} options={TITLE_STATUSES} />
                        </div>
                    </div>
                )}

                {currentStep === 6 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Current mileage" desc="Exact odometer reading in miles or kilometers." />
                                <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="modern-input standard-input" placeholder="e.g. 15000" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Where is the car located?" desc="City and State, or Zip Code." />
                                <input name="location" value={formData.location} onChange={handleChange} className="modern-input standard-input" placeholder="City, State / Zip" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label className="modern-checkbox-label">
                                <input type="checkbox" name="hasServiceHistory" checked={formData.hasServiceHistory} onChange={handleChange} />
                                <span style={{ fontWeight: 600, fontSize: '15px' }}>I have service records</span>
                            </label>
                            <label className="modern-checkbox-label">
                                <input type="checkbox" name="isModified" checked={formData.isModified} onChange={handleChange} />
                                <span style={{ fontWeight: 600, fontSize: '15px' }}>This vehicle has aftermarket modifications</span>
                            </label>
                        </div>
                    </div>
                )}

                {currentStep === 7 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Description & Story" desc="Provide a detailed history, maintenance records, and any notable modifications or flaws." />
                            <textarea name="description" value={formData.description} onChange={handleChange} className="modern-input modern-textarea" placeholder="Share the story of your vehicle. Mention maintenance history, modifications, or notable flaws..." />
                        </div>
                    </div>
                )}

                {currentStep === 8 && (
                    <div style={{ width: '100%' }}>
                        <ImageUploader
                            existingImages={formData.images}
                            newPreviews={previews}
                            onAddFiles={handleFileChange}
                            onRemoveExisting={handleRemoveExisting}
                            onRemoveNew={handleRemoveNew}
                        />
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "auto", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {currentStep > 1 ? (
                    <button type="button" onClick={handleBack} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "16px", height: "48px", padding: "0 24px", borderRadius: "24px", transition: "all 0.3s ease", backdropFilter: "blur(8px)" }}>Back</button>
                ) : (
                    onCancel ? <button type="button" onClick={onCancel} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "16px", height: "48px", padding: "0 24px", borderRadius: "24px", transition: "all 0.3s ease", backdropFilter: "blur(8px)" }}>Cancel</button> : null
                )}

                {currentStep < TOTAL_STEPS ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed()}
                        style={canProceed() ? { flex: 1, background: "white", color: "#000", border: "none", padding: "0 32px", height: "48px", borderRadius: "24px", fontWeight: 700, cursor: "pointer", fontSize: "16px", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: "0 8px 24px rgba(255,255,255,0.2)" } : { flex: 1, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.05)", padding: "0 32px", height: "48px", borderRadius: "24px", fontWeight: 600, cursor: "not-allowed", fontSize: "16px" }}
                    >
                        Continue
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ flex: 1, background: "linear-gradient(135deg, var(--accent-color), #ff5e00)", color: "#fff", border: "none", padding: "0 32px", height: "48px", borderRadius: "24px", fontWeight: 700, cursor: "pointer", fontSize: "16px", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: "0 12px 32px rgba(249, 115, 22, 0.4)" }}
                    >
                        {isLoading ? "Saving..." : submitLabel}
                    </button>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Remove Photo"
                message="Are you sure you want to remove this photo?"
                onConfirm={confirmRemoveExisting}
                onCancel={() => setConfirmDialog({ isOpen: false, targetId: null })}
                confirmLabel="Remove"
                isDestructive={true}
            />
        </form>

        <div className="submit-preview-container">
            <LiveListingPreview formData={formData} previewImage={previews[0] || formData.images[0]?.url || null} />
        </div>
        </div>
    );
};