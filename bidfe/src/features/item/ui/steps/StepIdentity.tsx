import { useMemo, type ChangeEvent } from "react";
import { styles } from "../styles";
import { Autocomplete } from "../../../../shared/ui/Autocomplete";
import carsData from "../../../../shared/data/cars.json";
import type { ItemFormData } from "../types";

interface Props {
    formData: ItemFormData;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    isEditMode: boolean;
    years: { value: string; label: string }[];
}

export const StepIdentity = ({ formData, handleChange, isEditMode, years }: Props) => {
    // All makes from the cars database
    const makes = useMemo(() =>
        (carsData as { brand: string; models: string[] }[]).map(c => c.brand).sort(),
        []
    );

    // Models for the currently selected make
    const models = useMemo(() => {
        const found = (carsData as { brand: string; models: string[] }[]).find(
            c => c.brand.toLowerCase() === formData.make?.toLowerCase()
        );
        return found ? found.models : [];
    }, [formData.make]);

    // Synthetic event factories so we reuse the parent handleChange
    const emitChange = (name: string, value: string) => {
        handleChange({ target: { name, value } } as ChangeEvent<HTMLInputElement>);
    };

    const handleMakeChange = (val: string) => {
        emitChange("make", val);
        // Reset model when make changes
        emitChange("model", "");
    };

    const handleModelChange = (val: string) => {
        emitChange("model", val);
    };

    return (
        <div style={styles.grid}>
            {/* VIN */}
            <div>
                <label style={styles.label}>VIN (17 Characters)</label>
                <input
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    maxLength={17}
                    minLength={17}
                    required
                    pattern="[A-HJ-NPR-Z0-9]{17}"
                    className="modern-input"
                    placeholder="e.g. WP0AB2A99KS162345"
                    disabled={isEditMode}
                    autoFocus
                />
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                    {formData.vin.length}/17 — Letters I, O, Q are not allowed
                </div>
            </div>

            {/* Year */}
            <div>
                <label style={styles.label}>Year</label>
                <Autocomplete
                    name="year"
                    value={formData.year?.toString()}
                    options={years.map(y => y.label)}
                    onChange={(val) => emitChange("year", val)}
                    placeholder="Select year…"
                    allowCustom={false}
                />
            </div>

            {/* Make + Model side by side */}
            <div style={styles.halfGrid}>
                <div>
                    <label style={styles.label}>Make</label>
                    <Autocomplete
                        name="make"
                        value={formData.make}
                        options={makes}
                        onChange={handleMakeChange}
                        placeholder="e.g. Porsche"
                        allowCustom={true}
                    />
                </div>
                <div>
                    <label style={styles.label}>Model</label>
                    <Autocomplete
                        name="model"
                        value={formData.model}
                        options={models}
                        onChange={handleModelChange}
                        placeholder={formData.make ? `Select ${formData.make} model…` : "Select make first"}
                        allowCustom={true}
                        disabled={!formData.make}
                    />
                </div>
            </div>
        </div>
    );
};
