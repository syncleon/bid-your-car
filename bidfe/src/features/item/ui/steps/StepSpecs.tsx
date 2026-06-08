import type { ChangeEvent } from "react";
import { styles } from "../styles";
import { Autocomplete } from "../../../../shared/ui/Autocomplete";

import type { ItemFormData } from "../types";

interface Props {
    formData: ItemFormData;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    transmissions: string[];
    drivetrains: string[];
    fuelTypes: string[];
    bodyStyles: string[];
}

export const StepSpecs = ({ formData, handleChange, transmissions, drivetrains, fuelTypes, bodyStyles }: Props) => {
    const emit = (name: string, value: string) =>
        handleChange({ target: { name, value } } as ChangeEvent<HTMLInputElement>);

    return (
        <div style={styles.grid}>
            {/* Mileage + Location */}
            <div style={styles.halfGrid}>
                <div>
                    <label style={styles.label}>Mileage (km)</label>
                    <input
                        type="number"
                        name="mileage"
                        value={formData.mileage}
                        onChange={handleChange}
                        className="modern-input"
                        placeholder="e.g. 15000"
                        min={0}
                        required
                    />
                </div>
                <div>
                    <label style={styles.label}>Location</label>
                    <input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="modern-input"
                        placeholder="City, Country"
                        required
                    />
                </div>
            </div>

            {/* Body Style + Transmission */}
            <div style={styles.halfGrid}>
                <div>
                    <label style={styles.label}>Body Style</label>
                    <Autocomplete
                        name="bodyStyle"
                        value={formData.bodyStyle}
                        options={bodyStyles}
                        onChange={(val) => emit("bodyStyle", val)}
                        placeholder="Select body style…"
                        allowCustom={false}
                    />
                </div>
                <div>
                    <label style={styles.label}>Transmission</label>
                    <Autocomplete
                        name="transmission"
                        value={formData.transmission}
                        options={transmissions}
                        onChange={(val) => emit("transmission", val)}
                        placeholder="Select transmission…"
                        allowCustom={false}
                    />
                </div>
            </div>

            {/* Drivetrain + Fuel Type */}
            <div style={styles.halfGrid}>
                <div>
                    <label style={styles.label}>Drivetrain</label>
                    <Autocomplete
                        name="drivetrain"
                        value={formData.drivetrain}
                        options={drivetrains}
                        onChange={(val) => emit("drivetrain", val)}
                        placeholder="Select drivetrain…"
                        allowCustom={false}
                    />
                </div>
                <div>
                    <label style={styles.label}>Fuel Type</label>
                    <Autocomplete
                        name="fuelType"
                        value={formData.fuelType}
                        options={fuelTypes}
                        onChange={(val) => emit("fuelType", val)}
                        placeholder="Select fuel type…"
                        allowCustom={false}
                    />
                </div>
            </div>

            {/* Engine + Horsepower */}
            <div style={styles.halfGrid}>
                <div>
                    <label style={styles.label}>Engine Details</label>
                    <input
                        name="engine"
                        value={formData.engine}
                        onChange={handleChange}
                        className="modern-input"
                        placeholder="e.g. 4.0L Flat-6"
                        required
                    />
                </div>
                <div>
                    <label style={styles.label}>Horsepower</label>
                    <input
                        type="number"
                        name="horsepower"
                        value={formData.horsepower}
                        onChange={handleChange}
                        className="modern-input"
                        placeholder="e.g. 500"
                        min={1}
                    />
                </div>
            </div>

            {/* Exterior + Interior Color */}
            <div style={styles.halfGrid}>
                <div>
                    <label style={styles.label}>Exterior Color</label>
                    <input
                        name="exteriorColor"
                        value={formData.exteriorColor}
                        onChange={handleChange}
                        className="modern-input"
                        placeholder="e.g. Guards Red"
                    />
                </div>
                <div>
                    <label style={styles.label}>Interior Color</label>
                    <input
                        name="interiorColor"
                        value={formData.interiorColor}
                        onChange={handleChange}
                        className="modern-input"
                        placeholder="e.g. Black Leather"
                    />
                </div>
            </div>
        </div>
    );
};
