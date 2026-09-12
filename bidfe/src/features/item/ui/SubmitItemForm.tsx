import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { VehicleSelect } from "./VehicleSelect";
import { ConfirmDialog } from "../../../shared/ui/dialog/ConfirmDialog";
import { LiveListingPreview } from "./LiveListingPreview";
import type { ItemCreateRequest, ItemImageDto, ConditionGrade, ImageCategory } from "../types";
import { useStore } from "../../../shared/hooks/useStore";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChipGroup = ({ options, value, onChange, name }: { options: {value: string, label: string, desc?: string}[], value: string, onChange: (e: any) => void, name: string }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((opt) => (
            <button
                key={opt.value}
                type="button"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const { itemStore } = useStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, targetId: string | null}>({ isOpen: false, targetId: null });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [loadingMakes, setLoadingMakes] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

    const [isCheckingVin, setIsCheckingVin] = useState(false);
    const [vinCheckPassed, setVinCheckPassed] = useState(false);

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

    const previewsRef = useRef<string[]>([]);
    useEffect(() => {
        previewsRef.current = previews;
    }, [previews]);

    useEffect(() => {
        return () => {
            previewsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        if (formData.vin.length === 17 && !isEditMode) {
            let isMounted = true;
            queueMicrotask(() => {
                setIsCheckingVin(true);
                setVinCheckPassed(false);
            });
            
            const timerId = setTimeout(() => {
                itemStore.checkVinExists(formData.vin).then(exists => {
                    if (!isMounted) return;
                    setIsCheckingVin(false);
                    if (exists) {
                        setErrors(prev => ({ ...prev, vin: "This vehicle is already listed in the system." }));
                    } else {
                        setErrors(prev => ({ ...prev, vin: "" }));
                        setVinCheckPassed(true);
                    }
                });
            }, 600);
            
            return () => { 
                isMounted = false;
                clearTimeout(timerId);
            };
        } else {
            queueMicrotask(() => {
                setVinCheckPassed(false);
                setIsCheckingVin(false);
            });
        }
    }, [formData.vin, itemStore, isEditMode]);

    useEffect(() => {
        if (currentStep === 2 && makes.length === 0) {
            const cachedMakes = localStorage.getItem('nhtsa_makes');
            if (cachedMakes) {
                queueMicrotask(() => setMakes(JSON.parse(cachedMakes)));
                return;
            }

            queueMicrotask(() => setLoadingMakes(true));
            fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json')
                .then(res => res.json())
                .then(data => {
                    if (data && data.Results) {
                        const allMakes = data.Results.map((item: { MakeName: string }) => toTitleCase(item.MakeName));
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
                queueMicrotask(() => setModels(JSON.parse(cachedModels)));
                return;
            }

            queueMicrotask(() => setLoadingModels(true));
            fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${formData.make}/modelyear/${formData.year}?format=json`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.Results) {
                        const parsedModels = data.Results.map((item: { Model_Name: string }) => toTitleCase(item.Model_Name)).sort();
                        setModels(parsedModels);
                        localStorage.setItem(cacheKey, JSON.stringify(parsedModels));
                    } else {
                        setModels([]);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingModels(false));
        } else {
            queueMicrotask(() => setModels([]));
        }
    }, [formData.make, formData.year]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: string; type?: string; } }) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        setErrors(prev => {
            const next = { ...prev, [name]: "" };
            if (name === 'make') next.model = "";
            return next;
        });

        setFormData(prev => {
            let parsedValue: string | number | boolean = value;
            if (isCheckbox) {
                parsedValue = checked;
            } else if (["mileage", "year", "horsepower"].includes(name)) {
                parsedValue = value === "" ? "" : Number(value);
            } else if (name === "vin") {
                parsedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[IOQ]/g, '');
            }
            
            const updates: Partial<typeof formData> = { [name]: parsedValue } as Partial<typeof formData>;
            
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
            setErrors(prev => ({ ...prev, images: "" }));
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

    const handleReorderNew = (dragIndex: number, hoverIndex: number) => {
        setFiles(prev => {
            const copy = [...prev];
            const item = copy.splice(dragIndex, 1)[0];
            copy.splice(hoverIndex, 0, item);
            return copy;
        });
        setPreviews(prev => {
            const copy = [...prev];
            const item = copy.splice(dragIndex, 1)[0];
            copy.splice(hoverIndex, 0, item);
            return copy;
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

    const validateStep = async (step: number) => {
        const newErrors: Record<string, string> = {};
        let isValid = true;
        
        if (step === 1) {
            if (formData.vin.length !== 17) {
                newErrors.vin = "VIN must be exactly 17 characters.";
                isValid = false;
            } else if (errors.vin) {
                // Already caught by useEffect check
                newErrors.vin = errors.vin;
                isValid = false;
            } else if (!vinCheckPassed) {
                // Fallback if trying to submit before check finishes
                const exists = await itemStore.checkVinExists(formData.vin);
                if (exists) {
                    newErrors.vin = "This vehicle is already listed in the system.";
                    isValid = false;
                } else {
                    setVinCheckPassed(true);
                }
            }
        } else if (step === 2) {
            const y = Number(formData.year);
            if (!y || y < 1900 || y > currentYear + 1) {
                newErrors.year = `Year must be between 1900 and ${currentYear + 1}.`;
                isValid = false;
            }
            if (!formData.make) { newErrors.make = "Please select a Make."; isValid = false; }
            if (!formData.model) { newErrors.model = "Please select a Model."; isValid = false; }
        } else if (step === 3) {
            if (!formData.transmission) { newErrors.transmission = "Transmission is required."; isValid = false; }
            if (!formData.drivetrain) { newErrors.drivetrain = "Drivetrain is required."; isValid = false; }
            if (!formData.fuelType) { newErrors.fuelType = "Fuel Type is required."; isValid = false; }
            if (formData.engine && formData.engine.length > 50) { newErrors.engine = "Engine description is too long (max 50 chars)."; isValid = false; }
            if (formData.horsepower !== "") {
                const hp = Number(formData.horsepower);
                if (hp <= 0 || hp > 2500) { newErrors.horsepower = "Horsepower must be between 1 and 2500."; isValid = false; }
            }
        } else if (step === 4) {
            if (!formData.bodyStyle) { newErrors.bodyStyle = "Body Style is required."; isValid = false; }
            if (!formData.exteriorColor || formData.exteriorColor.length < 2) { newErrors.exteriorColor = "Please enter a valid Exterior Color."; isValid = false; }
            if (!formData.interiorColor || formData.interiorColor.length < 2) { newErrors.interiorColor = "Please enter a valid Interior Color."; isValid = false; }
        } else if (step === 5) {
            if (!formData.condition) { newErrors.condition = "Condition is required."; isValid = false; }
            if (!formData.titleStatus) { newErrors.titleStatus = "Title Status is required."; isValid = false; }
        } else if (step === 6) {
            if (formData.mileage === "" || Number(formData.mileage) < 0 || Number(formData.mileage) > 3000000) {
                newErrors.mileage = "Please enter a valid mileage.";
                isValid = false;
            }
            if (!formData.location || formData.location.length < 2) {
                newErrors.location = "Please enter a valid location.";
                isValid = false;
            }
        } else if (step === 7) {
            if (!formData.description || formData.description.length < 50) {
                newErrors.description = "Please provide at least 50 characters to describe the vehicle.";
                isValid = false;
            }
        } else if (step === 8) {
            if (files.length === 0 && formData.images.length === 0) {
                newErrors.images = "Please upload at least one photo.";
                isValid = false;
            }
        }
        
        setErrors(newErrors);
        return isValid;
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

    const handleNext = async (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const isValid = await validateStep(currentStep);
        if (isValid) {
            changeStep(Math.min(currentStep + 1, TOTAL_STEPS));
        }
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (currentStep !== TOTAL_STEPS) { handleNext(); return; }
        const isValid = await validateStep(TOTAL_STEPS);
        if (!isValid) return;
        requestSubmit();
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "Vehicle Identification (VIN)";
            case 2: return "Basic Vehicle Information";
            case 3: return "Powertrain Specifications";
            case 4: return "Body Style & Colors";
            case 5: return "Condition & Title Status";
            case 6: return "History & Location";
            case 7: return "Vehicle Story & Highlights";
            case 8: return "Upload Photography";
            default: return "";
        }
    };



    return (
        <div className="submit-form-layout">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="submit-form-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Modern Attractive Progress Bar */}
            <div className="modern-progress-container" style={{ flexShrink: 0 }}>
                <div 
                    className="modern-progress-fill" 
                    style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                />
            </div>

            <div className="form-step-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
                <div style={{ textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h2 className="step-title" style={{ margin: 0 }}>{getStepTitle()}</h2>
                </div>

                {currentStep === 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <FormLabel title="17-Digit Vehicle Identification Number (VIN)" desc="Usually found on the driver's side dashboard or inside the driver's side door jamb. This helps us pull exact factory specifications." />
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input name="vin" value={formData.vin} onChange={handleChange} maxLength={17} className={`modern-input standard-input ${errors.vin ? 'input-error' : ''} ${vinCheckPassed ? 'vin-input-success' : ''}`} style={{ fontSize: '20px', letterSpacing: '2px', textTransform: 'uppercase', width: '100%', paddingRight: '48px'}} placeholder="Enter 17-digit VIN (e.g. WBA00...)" disabled={isEditMode || isCheckingVin} autoFocus />
                                    {isCheckingVin && (
                                        <div className="vin-success-icon" style={{ opacity: 0.5 }}>
                                            <div className="spinner-border spinner-border-sm" role="status"></div>
                                        </div>
                                    )}
                                    {vinCheckPassed && (
                                        <div className="vin-success-icon">
                                            <ShieldCheck size={26} strokeWidth={2.5} />
                                        </div>
                                    )}
                                </div>
                                {errors.vin && <span className="error-text"><AlertCircle size={14} />{errors.vin}</span>}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Model Year" desc="The official release year of the vehicle." />
                            <input type="number" name="year" value={formData.year} onChange={handleChange} className={`modern-input standard-input ${errors.year ? 'input-error' : ''}`} min="1900" max={new Date().getFullYear() + 1} placeholder="e.g. 2024" />
                            {errors.year && <span className="error-text"><AlertCircle size={14} />{errors.year}</span>}
                        </div>
                        <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Make" desc="The manufacturer (e.g., Porsche, BMW)." />
                            <VehicleSelect name="make" value={formData.make} onChange={handleChange} options={makes} loading={loadingMakes} placeholder="Enter Make..." hasError={!!errors.make} />
                            {errors.make && <span className="error-text"><AlertCircle size={14} />{errors.make}</span>}
                        </div>
                        <div style={{ zIndex: 9, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Model" desc="The specific model designation (e.g., 911, M3)." />
                            <VehicleSelect name="model" value={formData.model} onChange={handleChange} options={models} loading={loadingModels} disabled={!formData.make} placeholder={!formData.make ? "Enter Make first..." : "Enter Model..."} hasError={!!errors.model} />
                            {errors.model && <span className="error-text"><AlertCircle size={14} />{errors.model}</span>}
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <FormLabel title="Transmission" desc="Select the gearbox type (Automatic, Manual, etc.)." />
                                <ChipGroup name="transmission" value={formData.transmission} onChange={handleChange} options={TRANSMISSIONS} />
                                {errors.transmission && <span className="error-text"><AlertCircle size={14} />{errors.transmission}</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <FormLabel title="Drivetrain" desc="Select the driven wheels (RWD, AWD, etc.)." />
                                <ChipGroup name="drivetrain" value={formData.drivetrain} onChange={handleChange} options={DRIVETRAINS} />
                                {errors.drivetrain && <span className="error-text"><AlertCircle size={14} />{errors.drivetrain}</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <FormLabel title="Fuel Type" desc="Select the primary fuel source." />
                                <ChipGroup name="fuelType" value={formData.fuelType} onChange={handleChange} options={FUEL_TYPES} />
                                {errors.fuelType && <span className="error-text"><AlertCircle size={14} />{errors.fuelType}</span>}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Engine Details (Optional)" desc="Engine displacement and configuration (e.g., 4.0L Flat-6)." />
                                <input name="engine" value={formData.engine} onChange={handleChange} className={`modern-input standard-input ${errors.engine ? 'input-error' : ''}`} placeholder="e.g. 4.0L Flat-6" />
                                {errors.engine && <span className="error-text"><AlertCircle size={14} />{errors.engine}</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Horsepower (Optional)" desc="Factory rating or documented dyno output." />
                                <input type="number" name="horsepower" value={formData.horsepower} onChange={handleChange} className={`modern-input standard-input ${errors.horsepower ? 'input-error' : ''}`} placeholder="e.g. 500" />
                                {errors.horsepower && <span className="error-text"><AlertCircle size={14} />{errors.horsepower}</span>}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <FormLabel title="Body Style" desc="Choose the vehicle's structural design (Sedan, Coupe, SUV, etc.)." />
                            <ChipGroup name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} options={BODY_STYLES} />
                            {errors.bodyStyle && <span className="error-text"><AlertCircle size={14} />{errors.bodyStyle}</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Exterior Color" desc="The primary factory or custom paint color." />
                                <input name="exteriorColor" value={formData.exteriorColor} onChange={handleChange} className={`modern-input standard-input ${errors.exteriorColor ? 'input-error' : ''}`} placeholder="e.g. Guards Red" />
                                {errors.exteriorColor && <span className="error-text"><AlertCircle size={14} />{errors.exteriorColor}</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Interior Color & Material" desc="The dominant interior color and upholstery type (e.g., Black Leather)." />
                                <input name="interiorColor" value={formData.interiorColor} onChange={handleChange} className={`modern-input standard-input ${errors.interiorColor ? 'input-error' : ''}`} placeholder="e.g. Black Leather" />
                                {errors.interiorColor && <span className="error-text"><AlertCircle size={14} />{errors.interiorColor}</span>}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <FormLabel title="Overall Condition" desc="Provide an honest assessment of the vehicle's mechanical and cosmetic state." />
                            <ChipGroup name="condition" value={formData.condition} onChange={handleChange} options={CONDITION_GRADES} />
                            {errors.condition && <span className="error-text"><AlertCircle size={14} />{errors.condition}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <FormLabel title="Title Status" desc="Indicate the legal status of the title (Clean, Salvage, Rebuilt, etc.)." />
                            <ChipGroup name="titleStatus" value={formData.titleStatus} onChange={handleChange} options={TITLE_STATUSES} />
                            {errors.titleStatus && <span className="error-text"><AlertCircle size={14} />{errors.titleStatus}</span>}
                        </div>
                    </div>
                )}

                {currentStep === 6 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Current Mileage" desc="The exact reading currently displayed on the odometer." />
                                <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className={`modern-input standard-input ${errors.mileage ? 'input-error' : ''}`} placeholder="e.g. 15000" />
                                {errors.mileage && <span className="error-text"><AlertCircle size={14} />{errors.mileage}</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'space-between', height: '100%' }}>
                                <FormLabel title="Vehicle Location" desc="Where the car is currently stored (City, State, or Zip Code)." />
                                <input name="location" value={formData.location} onChange={handleChange} className={`modern-input standard-input ${errors.location ? 'input-error' : ''}`} placeholder="City, State / Zip" />
                                {errors.location && <span className="error-text"><AlertCircle size={14} />{errors.location}</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label className="modern-checkbox-label">
                                <input type="checkbox" name="hasServiceHistory" checked={formData.hasServiceHistory} onChange={handleChange} />
                                <span style={{ fontWeight: 600, fontSize: '15px' }}>I have documented maintenance and service records</span>
                            </label>
                            <label className="modern-checkbox-label">
                                <input type="checkbox" name="isModified" checked={formData.isModified} onChange={handleChange} />
                                <span style={{ fontWeight: 600, fontSize: '15px' }}>This vehicle has aftermarket or custom modifications</span>
                            </label>
                        </div>
                    </div>
                )}

                {currentStep === 7 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FormLabel title="Vehicle History & Highlights" desc="Tell us the story of this car. Buyers love details about ownership history, recent maintenance, specific modifications, and any known flaws." />
                            <textarea name="description" value={formData.description} onChange={handleChange} className={`modern-input modern-textarea ${errors.description ? 'input-error' : ''}`} placeholder="I purchased this car in 2020... It has a full service history... Recent work includes..." />
                            {errors.description && <span className="error-text"><AlertCircle size={14} />{errors.description}</span>}
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
                            onReorderNew={handleReorderNew}
                        />
                        {errors.images && <span className="error-text" style={{marginTop: '12px'}}><AlertCircle size={14} />{errors.images}</span>}
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: "12px", flexShrink: 0, paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {currentStep > 1 ? (
                    <button type="button" onClick={handleBack} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "16px", height: "48px", padding: "0 24px", borderRadius: "6px", transition: "all 0.3s ease", backdropFilter: "blur(8px)" }}>Back</button>
                ) : (
                    onCancel ? <button type="button" onClick={onCancel} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "16px", height: "48px", padding: "0 24px", borderRadius: "6px", transition: "all 0.3s ease", backdropFilter: "blur(8px)" }}>Cancel</button> : null
                )}

                {currentStep < TOTAL_STEPS ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        style={{ flex: 1, background: "white", color: "#000", border: "none", padding: "0 32px", height: "48px", borderRadius: "6px", fontWeight: 700, cursor: "pointer", fontSize: "16px", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: "0 8px 24px rgba(255,255,255,0.2)" }}
                    >
                        Continue
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ flex: 1, background: "linear-gradient(135deg, var(--accent-color), #ff5e00)", color: "#fff", border: "none", padding: "0 32px", height: "48px", borderRadius: "6px", fontWeight: 700, cursor: "pointer", fontSize: "16px", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: "0 12px 32px rgba(249, 115, 22, 0.4)" }}
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
