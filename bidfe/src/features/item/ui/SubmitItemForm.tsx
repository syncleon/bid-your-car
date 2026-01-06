import { useState } from "react";
import type { ItemSubmitRequest, ItemDto } from "../types";
import { FormInput, FormSelect, FormSection } from "./form-components";

// Predefined Options for Selects
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
    { value: "CVT", label: "CVT (Continuously Variable)" },
    { value: "DCT", label: "DCT (Dual Clutch)" }
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
    onSubmit: (data: ItemSubmitRequest) => void;
    isLoading: boolean;
}

export const SubmitItemForm = ({ initialData, onSubmit, isLoading }: Props) => {
    // Helper to initialize fields safely
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "buyNowPrice"
                ? (value === "" ? null : Number(value))
                : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
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
                    hint="The 17-character Vehicle Identification Number found on the dashboard or door jamb."
                />
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
                <FormSelect
                    label="Body Style"
                    name="bodyStyle"
                    value={formData.bodyStyle || ""}
                    onChange={handleChange}
                    options={BODY_STYLES}
                />
            </FormSection>

            {/* Section 2: Technical Specifications */}
            <FormSection title="Technical Specifications">
                <FormInput
                    label="Engine"
                    name="engine"
                    value={formData.engine || ""}
                    onChange={handleChange}
                    placeholder="e.g. 3.0L Twin-Turbo Inline-6"
                    hint="Displacement, cylinder count, and aspiration (Turbo/NA)."
                />
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
            </FormSection>

            {/* Section 3: Colors & Location */}
            <FormSection title="Appearance & Location">
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
                    placeholder="e.g. Black Nappa Leather"
                />
                <FormInput
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="City, State, Zip"
                    hint="Where is the vehicle currently located?"
                />
            </FormSection>

            {/* Section 4: Sale Info */}
            <FormSection title="Sale Details">
                <FormInput
                    label="Buy Now Price ($)"
                    name="buyNowPrice"
                    type="number"
                    value={formData.buyNowPrice ?? ""}
                    onChange={handleChange}
                    placeholder="0.00"
                    hint="Leave empty if this is an auction-only listing."
                />
                <FormSelect
                    label="Seller Type"
                    name="sellerType"
                    value={formData.sellerType || ""}
                    onChange={handleChange}
                    options={SELLER_TYPES}
                    hint="Are you selling as an individual or a business?"
                />
            </FormSection>

            <button
                type="submit"
                disabled={isLoading}
                style={{
                    marginTop: "16px",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "none",
                    background: isLoading ? "#9ca3af" : "#000",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    width: "100%",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}
            >
                {isLoading ? "Processing..." : (initialData ? "Save Changes" : "Publish Listing")}
            </button>
        </form>
    );
};