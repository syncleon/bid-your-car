import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { ArrowLeft, AlertCircle, Save, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { useStore } from "../../shared/hooks/useStore";
import { ImageUploader } from "../../features/item/ui/ImageUploader";
import type { ItemDto, ItemUpdateRequest, ImageCategory, ConditionGrade } from "../../features/item/types";
import "./EditItemPage.css";

const BODY_STYLES = [
    "Sedan", "Coupe", "SUV", "Convertible", "Hatchback", 
    "Wagon", "Truck", "Van", "Motorcycle"
];

const TRANSMISSIONS = [
    "Automatic", "Manual", "CVT", "DCT", "PDK/Dual Clutch"
];

const DRIVETRAINS = [
    "RWD", "FWD", "AWD", "4WD"
];

const FUEL_TYPES = [
    "Gasoline", "Diesel", "Electric", "Hybrid", "PHEV"
];

const TITLE_STATUSES = [
    "Clean", "Salvage", "Rebuilt", "Lien"
];

const CONDITION_GRADES: { value: ConditionGrade; label: string; desc: string }[] = [
    { value: "EXCELLENT", label: "Excellent", desc: "Near-perfect, no visible flaws" },
    { value: "VERY_GOOD", label: "Very Good", desc: "Minor cosmetic blemishes" },
    { value: "GOOD", label: "Good", desc: "Normal wear, mechanically sound" },
    { value: "FAIR", label: "Fair", desc: "Noticeable wear, driveable" },
    { value: "POOR", label: "Poor", desc: "Significant issues" },
    { value: "PARTS_ONLY", label: "Parts Only", desc: "Non-running / Damaged" },
];

export const EditItemPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { itemStore, authStore } = useStore();

    const [item, setItem] = useState<ItemDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form data state
    const [formData, setFormData] = useState<Partial<ItemUpdateRequest>>({
        year: undefined,
        make: "",
        model: "",
        mileage: undefined,
        location: "",
        sellerType: "Private Party",
        titleStatus: "Clean",
        condition: "GOOD" as ConditionGrade,
        fuelType: "Gasoline",
        horsepower: undefined,
        engine: "",
        transmission: "Automatic",
        drivetrain: "RWD",
        bodyStyle: "Sedan",
        exteriorColor: "",
        interiorColor: "",
        hasServiceHistory: false,
        isModified: false,
        highlights: "",
        knownFlaws: "",
        recentServiceHistory: "",
        otherItemsIncluded: "",
        description: "",
    });

    // Images state
    const [existingImages, setExistingImages] = useState<any[]>([]);
    const [newFiles, setNewFiles] = useState<{ file: File; category: ImageCategory }[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);
    const [originalPreviews, setOriginalPreviews] = useState<string[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setLoadError(null);
        itemStore.loadItemForEdit(id).then((loaded) => {
            if (loaded) {
                setItem(loaded as ItemDto);
                setFormData({
                    year: loaded.year,
                    make: loaded.make || "",
                    model: loaded.model || "",
                    mileage: loaded.mileage,
                    location: loaded.location || "",
                    sellerType: loaded.sellerType || "Private Party",
                    titleStatus: loaded.titleStatus || "Clean",
                    condition: loaded.condition || "GOOD",
                    fuelType: loaded.fuelType || "Gasoline",
                    horsepower: loaded.horsepower ?? undefined,
                    engine: loaded.engine || "",
                    transmission: loaded.transmission || "Automatic",
                    drivetrain: loaded.drivetrain || "RWD",
                    bodyStyle: loaded.bodyStyle || "Sedan",
                    exteriorColor: loaded.exteriorColor || "",
                    interiorColor: loaded.interiorColor || "",
                    hasServiceHistory: Boolean(loaded.hasServiceHistory),
                    isModified: Boolean(loaded.isModified),
                    highlights: loaded.highlights || "",
                    knownFlaws: loaded.knownFlaws || "",
                    recentServiceHistory: loaded.recentServiceHistory || "",
                    otherItemsIncluded: loaded.otherItemsIncluded || "",
                    description: loaded.description || "",
                });
                const sortedImages = [...(loaded.images || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                setExistingImages(sortedImages);
            } else {
                setLoadError(itemStore.error || "Failed to load vehicle details for editing.");
            }
        }).catch((err) => {
            setLoadError(err?.message || "Failed to load vehicle details.");
        }).finally(() => {
            setLoading(false);
        });

        return () => {
            // Clean up object URLs
            newPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [id, itemStore]);

    if (loading) {
        return (
            <div className="edit-page-container">
                <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Loading vehicle details...</div>
                    <div style={{ fontSize: "13px", opacity: 0.7 }}>Please wait while we fetch the latest specifications.</div>
                </div>
            </div>
        );
    }

    if (!item || loadError) {
        return (
            <div className="edit-page-container">
                <div className="edit-alert-banner edit-alert-error">
                    <AlertCircle size={20} />
                    <div>
                        <strong>Vehicle Not Found or Inaccessible:</strong> {loadError || "The requested vehicle could not be loaded or you do not have permission to view it."}
                    </div>
                </div>
                <button className="edit-back-btn" onClick={() => navigate("/profile")}>
                    <ArrowLeft size={16} /> Back to My Inventory
                </button>
            </div>
        );
    }

    const isOwner = authStore.user?.id === item.seller?.id;
    const isAdmin = Boolean(authStore.user?.roles.some(r => r.name === "ADMIN"));
    const isAuthorized = isOwner || isAdmin;
    const isEditable = item.status === "DRAFT" || item.status === "UNSOLD" || item.status === "REJECTED";

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => {
            let parsed: any = value;
            if (type === "number") {
                parsed = value === "" ? undefined : Number(value);
            } else if (type === "checkbox") {
                parsed = (e.target as HTMLInputElement).checked;
            }
            return { ...prev, [name]: parsed };
        });
    };

    const handleConditionChange = (condition: ConditionGrade) => {
        setFormData(prev => ({ ...prev, condition }));
    };

    // Photo handlers
    const handleAddFiles = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const added = Array.from(e.target.files);
            setNewFiles(prev => [...prev, ...added.map(f => ({ file: f, category: "EXTERIOR" as ImageCategory }))]);
            setNewPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))]);
            setOriginalPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))]);
        }
    };

    const handleRemoveExisting = (id: string) => {
        setExistingImages(prev => prev.filter(img => img.id !== id));
    };

    const handleReorderExisting = (dragIndex: number, hoverIndex: number) => {
        if (dragIndex === hoverIndex) return;
        setExistingImages(prev => {
            const copy = [...prev];
            const [moved] = copy.splice(dragIndex, 1);
            copy.splice(hoverIndex, 0, moved);
            return copy.map((img, idx) => {
                if (idx === 0) return { ...img, category: "MAIN" as ImageCategory };
                if (img.category === "MAIN") return { ...img, category: "EXTERIOR" as ImageCategory };
                return img;
            });
        });
    };

    const handleMoveExisting = (index: number, direction: 'left' | 'right') => {
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= existingImages.length) return;
        handleReorderExisting(index, targetIndex);
    };

    const handleSetMainExisting = (id: string) => {
        setExistingImages(prev => {
            const targetIndex = prev.findIndex(img => img.id === id);
            if (targetIndex === -1) return prev;
            if (targetIndex === 0) {
                return prev.map((img, idx) => ({
                    ...img,
                    category: (idx === 0 ? "MAIN" : (img.category === "MAIN" ? "EXTERIOR" : img.category)) as ImageCategory
                }));
            }
            const target = { ...prev[targetIndex], category: "MAIN" as ImageCategory };
            const remaining = prev.filter(img => img.id !== id).map(img =>
                img.category === "MAIN" ? { ...img, category: "EXTERIOR" as ImageCategory } : img
            );
            return [target, ...remaining];
        });
        setNewFiles(prev => prev.map(f => f.category === "MAIN" ? { ...f, category: "EXTERIOR" as ImageCategory } : f));
    };

    const handleRemoveNew = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
        setNewPreviews(prev => {
            const copy = [...prev];
            URL.revokeObjectURL(copy[index]);
            copy.splice(index, 1);
            return copy;
        });
        setOriginalPreviews(prev => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleReorderNew = (dragIndex: number, hoverIndex: number) => {
        if (dragIndex === hoverIndex) return;
        setNewFiles(prev => {
            const copy = [...prev];
            const item = copy[dragIndex];
            copy.splice(dragIndex, 1);
            copy.splice(hoverIndex, 0, item);
            return copy;
        });
        setNewPreviews(prev => {
            const copy = [...prev];
            const item = copy[dragIndex];
            copy.splice(dragIndex, 1);
            copy.splice(hoverIndex, 0, item);
            return copy;
        });
        setOriginalPreviews(prev => {
            const copy = [...prev];
            const item = copy[dragIndex];
            copy.splice(dragIndex, 1);
            copy.splice(hoverIndex, 0, item);
            return copy;
        });
    };

    const handleMoveNew = (index: number, direction: 'left' | 'right') => {
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newPreviews.length) return;
        handleReorderNew(index, targetIndex);
    };

    const handleSetMainNew = (index: number) => {
        setExistingImages(prev => prev.map(img =>
            img.category === "MAIN" ? { ...img, category: "EXTERIOR" as ImageCategory } : img
        ));
        setNewFiles(prev => {
            const copy = [...prev];
            const [target] = copy.splice(index, 1);
            const updatedTarget = { ...target, category: "MAIN" as ImageCategory };
            const updatedRemaining = copy.map(f => f.category === "MAIN" ? { ...f, category: "EXTERIOR" as ImageCategory } : f);
            return [updatedTarget, ...updatedRemaining];
        });
        setNewPreviews(prev => {
            const copy = [...prev];
            const [target] = copy.splice(index, 1);
            return [target, ...copy];
        });
        setOriginalPreviews(prev => {
            const copy = [...prev];
            const [target] = copy.splice(index, 1);
            return [target, ...copy];
        });
    };

    const handleReplaceNewFile = (index: number, newFile: File, newPreview: string) => {
        setNewFiles(prev => {
            const next = [...prev];
            next[index] = { file: newFile, category: next[index].category };
            return next;
        });
        setNewPreviews(prev => {
            const next = [...prev];
            URL.revokeObjectURL(next[index]);
            next[index] = newPreview;
            return next;
        });
    };

    const handleReplaceExistingWithNew = (existingId: string, newFile: File, newPreview: string) => {
        handleRemoveExisting(existingId);
        setNewFiles(prev => [...prev, { file: newFile, category: "EXTERIOR" }]);
        setNewPreviews(prev => [...prev, newPreview]);
        const origImg = existingImages.find(i => i.id === existingId) || item.images.find(i => i.id === existingId);
        setOriginalPreviews(prev => [...prev, origImg ? origImg.url : newPreview]);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!isAuthorized || !isEditable) return;

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const keepImageIds = existingImages.map(img => img.id);
            await itemStore.updateListing(item.id, formData, newFiles, keepImageIds);
            setSaveSuccess(true);
            setTimeout(() => {
                navigate(`/items/${item.id}`);
            }, 600);
        } catch (err: any) {
            console.error("Save error:", err);
            setSaveError(err?.message || "Failed to save listing changes. Please review your entries.");
        } finally {
            setSaving(false);
        }
    };

    const getStatusPillClass = (status: string) => {
        switch (status) {
            case "DRAFT": return "edit-status-draft";
            case "REJECTED": return "edit-status-rejected";
            case "UNSOLD": return "edit-status-unsold";
            default: return "edit-status-locked";
        }
    };

    return (
        <div className="edit-page-container">
            {/* Header & Breadcrumb */}
            <header className="edit-page-header">
                <button className="edit-back-btn" onClick={() => navigate(`/items/${item.id}`)}>
                    <ArrowLeft size={16} /> Back to Vehicle
                </button>
                <div className="edit-header-title-row">
                    <div className="edit-title-group">
                        <h1 className="edit-page-title">
                            Edit Details &amp; Specs: {formData.year || item.year} {formData.make || item.make} {formData.model || item.model}
                        </h1>
                        <div className="edit-header-meta">
                            <span className="edit-vin-badge">
                                <Lock size={12} /> VIN: {item.vin}
                            </span>
                            <span className={`edit-status-pill ${getStatusPillClass(item.status)}`}>
                                {item.status.replace("_", " ")}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Permission Guard Alert */}
            {!isAuthorized && (
                <div className="edit-alert-banner edit-alert-error">
                    <ShieldAlert size={20} />
                    <div>
                        <strong>Access Denied:</strong> You are not authorized to edit this vehicle listing. Only the owner or an administrator can modify details.
                    </div>
                </div>
            )}

            {/* Editable Status Guard Alert */}
            {!isEditable && (
                <div className="edit-alert-banner edit-alert-warning">
                    <AlertCircle size={20} />
                    <div>
                        <strong>Listing Locked:</strong> This vehicle is currently in an active or scheduled auction (Status: {item.status}). Vehicle specifications cannot be modified once an auction is pending or live.
                    </div>
                </div>
            )}

            {/* Form Error Banner */}
            {saveError && (
                <div className="edit-alert-banner edit-alert-error">
                    <AlertCircle size={20} />
                    <div>
                        <strong>Unable to Save:</strong> {saveError}
                    </div>
                </div>
            )}

            {/* Save Success Banner */}
            {saveSuccess && (
                <div className="edit-alert-banner" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)" }}>
                    <CheckCircle2 size={20} />
                    <div>
                        <strong>Saved Successfully!</strong> Redirecting to vehicle details...
                    </div>
                </div>
            )}

            <form onSubmit={handleSave}>
                {/* 1. Photos & Media */}
                <div className="edit-section-card">
                    <div className="edit-section-header">
                        <h2 className="edit-section-title">Photo Gallery</h2>
                        <p className="edit-section-subtitle">
                            Manage vehicle photos. The first image is used as the primary listing thumbnail. Drag to reorder, click edit to crop or rotate.
                        </p>
                    </div>
                    <ImageUploader
                        existingImages={existingImages}
                        newPreviews={newPreviews}
                        originalPreviews={originalPreviews}
                        onAddFiles={handleAddFiles}
                        onRemoveExisting={handleRemoveExisting}
                        onRemoveNew={handleRemoveNew}
                        onReorderExisting={handleReorderExisting}
                        onMoveExisting={handleMoveExisting}
                        onSetMainExisting={handleSetMainExisting}
                        onReorderNew={handleReorderNew}
                        onMoveNew={handleMoveNew}
                        onSetMainNew={handleSetMainNew}
                        onReplaceNewFile={handleReplaceNewFile}
                        onReplaceExistingWithNew={handleReplaceExistingWithNew}
                    />
                </div>

                {/* 2. Core Vehicle Specifications */}
                <div className="edit-section-card">
                    <div className="edit-section-header">
                        <h2 className="edit-section-title">Core Specifications</h2>
                        <p className="edit-section-subtitle">Primary vehicle identification and legal title details.</p>
                    </div>

                    <div className="edit-form-grid-3">
                        <div className="edit-field-group">
                            <label className="edit-field-label">
                                VIN <span style={{ opacity: 0.6 }}>(Read-only)</span>
                            </label>
                            <input
                                className="edit-input"
                                value={item.vin}
                                disabled
                                readOnly
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">
                                Year <span className="edit-field-required">*</span>
                            </label>
                            <input
                                className="edit-input"
                                type="number"
                                name="year"
                                min={1900}
                                max={new Date().getFullYear() + 1}
                                value={formData.year ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                required
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">
                                Make <span className="edit-field-required">*</span>
                            </label>
                            <input
                                className="edit-input"
                                type="text"
                                name="make"
                                value={formData.make ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                required
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">
                                Model <span className="edit-field-required">*</span>
                            </label>
                            <input
                                className="edit-input"
                                type="text"
                                name="model"
                                value={formData.model ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                required
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">
                                Mileage <span className="edit-field-required">*</span>
                            </label>
                            <input
                                className="edit-input"
                                type="number"
                                name="mileage"
                                min={0}
                                value={formData.mileage ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="e.g. 45000"
                                required
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Title Status</label>
                            <select
                                className="edit-select"
                                name="titleStatus"
                                value={formData.titleStatus ?? "Clean"}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            >
                                {TITLE_STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Location (City, State)</label>
                            <input
                                className="edit-input"
                                type="text"
                                name="location"
                                value={formData.location ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="e.g. Los Angeles, CA"
                                required
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Seller Type</label>
                            <select
                                className="edit-select"
                                name="sellerType"
                                value={formData.sellerType ?? "Private Party"}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            >
                                <option value="Private Party">Private Party</option>
                                <option value="Dealer">Dealer</option>
                            </select>
                        </div>
                    </div>

                    {/* Condition Grade Chips */}
                    <div className="edit-field-group" style={{ marginTop: "20px" }}>
                        <label className="edit-field-label">Condition Grade</label>
                        <div className="edit-chips-wrap">
                            {CONDITION_GRADES.map(grade => (
                                <button
                                    key={grade.value}
                                    type="button"
                                    className={`edit-condition-chip ${formData.condition === grade.value ? "active" : ""}`}
                                    onClick={() => handleConditionChange(grade.value)}
                                    disabled={!isEditable || !isAuthorized}
                                >
                                    <span className="edit-chip-title">{grade.label}</span>
                                    <span className="edit-chip-desc">{grade.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Powertrain & Mechanical */}
                <div className="edit-section-card">
                    <div className="edit-section-header">
                        <h2 className="edit-section-title">Powertrain &amp; Mechanical</h2>
                        <p className="edit-section-subtitle">Drivetrain, engine output, transmission, and styling details.</p>
                    </div>

                    <div className="edit-form-grid-3">
                        <div className="edit-field-group">
                            <label className="edit-field-label">Engine</label>
                            <input
                                className="edit-input"
                                type="text"
                                name="engine"
                                value={formData.engine ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="e.g. 3.0L Twin-Turbo I6"
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Horsepower (HP)</label>
                            <input
                                className="edit-input"
                                type="number"
                                name="horsepower"
                                min={0}
                                value={formData.horsepower ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="e.g. 382"
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Fuel Type</label>
                            <select
                                className="edit-select"
                                name="fuelType"
                                value={formData.fuelType ?? "Gasoline"}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            >
                                {FUEL_TYPES.map(fuel => (
                                    <option key={fuel} value={fuel}>{fuel}</option>
                                ))}
                            </select>
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Transmission</label>
                            <select
                                className="edit-select"
                                name="transmission"
                                value={formData.transmission ?? "Automatic"}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            >
                                {TRANSMISSIONS.map(trans => (
                                    <option key={trans} value={trans}>{trans}</option>
                                ))}
                            </select>
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Drivetrain</label>
                            <select
                                className="edit-select"
                                name="drivetrain"
                                value={formData.drivetrain ?? "RWD"}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            >
                                {DRIVETRAINS.map(dt => (
                                    <option key={dt} value={dt}>{dt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Body Style</label>
                            <select
                                className="edit-select"
                                name="bodyStyle"
                                value={formData.bodyStyle ?? "Sedan"}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            >
                                {BODY_STYLES.map(style => (
                                    <option key={style} value={style}>{style}</option>
                                ))}
                            </select>
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Exterior Color</label>
                            <input
                                className="edit-input"
                                type="text"
                                name="exteriorColor"
                                value={formData.exteriorColor ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="e.g. Mineral Grey Metallic"
                            />
                        </div>

                        <div className="edit-field-group">
                            <label className="edit-field-label">Interior Color</label>
                            <input
                                className="edit-input"
                                type="text"
                                name="interiorColor"
                                value={formData.interiorColor ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="e.g. Black Leather"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Vehicle History & Attribute Toggles */}
                <div className="edit-section-card">
                    <div className="edit-section-header">
                        <h2 className="edit-section-title">History &amp; Modifications</h2>
                        <p className="edit-section-subtitle">Indicate service records presence and aftermarket alterations.</p>
                    </div>

                    <div className="edit-toggle-row">
                        <label className={`edit-toggle-card ${formData.hasServiceHistory ? "checked" : ""}`}>
                            <input
                                type="checkbox"
                                name="hasServiceHistory"
                                checked={Boolean(formData.hasServiceHistory)}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            />
                            <div className="edit-toggle-label-group">
                                <span className="edit-toggle-title">Service Records Included</span>
                                <span className="edit-toggle-desc">Original maintenance receipts, dealer logs, or Carfax history.</span>
                            </div>
                        </label>

                        <label className={`edit-toggle-card ${formData.isModified ? "checked" : ""}`}>
                            <input
                                type="checkbox"
                                name="isModified"
                                checked={Boolean(formData.isModified)}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                            />
                            <div className="edit-toggle-label-group">
                                <span className="edit-toggle-title">Modified Vehicle</span>
                                <span className="edit-toggle-desc">Aftermarket exhaust, tune, suspension, wheels, or body modifications.</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 5. Editorial Sections & Story */}
                <div className="edit-section-card">
                    <div className="edit-section-header">
                        <h2 className="edit-section-title">Editorial Details &amp; Notes</h2>
                        <p className="edit-section-subtitle">
                            Provide full transparency regarding equipment, defects, and recent maintenance for prospective buyers.
                        </p>
                    </div>

                    <div className="edit-form-grid-2">
                        <div className="edit-field-group edit-field-full">
                            <label className="edit-field-label">Equipment &amp; Highlights</label>
                            <textarea
                                className="edit-textarea"
                                name="highlights"
                                value={formData.highlights ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="Factory options, premium packages, carbon fiber trim, upgraded audio, rare specifications..."
                            />
                        </div>

                        <div className="edit-field-group edit-field-full">
                            <label className="edit-field-label">Known Flaws &amp; Wear</label>
                            <textarea
                                className="edit-textarea"
                                name="knownFlaws"
                                value={formData.knownFlaws ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="Scratches, stone chips, curb rash, leather wear, dent on right fender, warning lights..."
                            />
                        </div>

                        <div className="edit-field-group edit-field-full">
                            <label className="edit-field-label">Recent Service History</label>
                            <textarea
                                className="edit-textarea"
                                name="recentServiceHistory"
                                value={formData.recentServiceHistory ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="Date, mileage, and description of recent work (e.g., Oil change & brake pads at 42,000 miles)..."
                            />
                        </div>

                        <div className="edit-field-group edit-field-full">
                            <label className="edit-field-label">Other Items Included</label>
                            <textarea
                                className="edit-textarea"
                                name="otherItemsIncluded"
                                value={formData.otherItemsIncluded ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="2 keys, original window sticker, owner's manual, OEM wheels, car cover, spare tire..."
                            />
                        </div>

                        <div className="edit-field-group edit-field-full">
                            <label className="edit-field-label">Seller Description / Story</label>
                            <textarea
                                className="edit-textarea"
                                name="description"
                                value={formData.description ?? ""}
                                onChange={handleChange}
                                disabled={!isEditable || !isAuthorized}
                                placeholder="Share ownership history, driving impressions, care routine, or reasons for selling..."
                                style={{ minHeight: "140px" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="edit-sticky-footer">
                    <div className="edit-footer-summary">
                        <span>Status: <strong>{item.status.replace("_", " ")}</strong></span>
                        <span>•</span>
                        <span>Photos: <strong>{existingImages.length + newFiles.length}</strong></span>
                    </div>

                    <div className="edit-footer-actions">
                        <button
                            type="button"
                            className="edit-btn-cancel"
                            onClick={() => navigate(`/items/${item.id}`)}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="edit-btn-save"
                            disabled={saving || !isEditable || !isAuthorized}
                        >
                            <Save size={16} />
                            {saving ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
});
