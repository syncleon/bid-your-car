import type { ChangeEvent } from "react";
import { styles } from "../styles";

interface Props {
    formData: any;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    isEditMode: boolean;
    years: { value: string, label: string }[];
}

export const StepIdentity = ({ formData, handleChange, isEditMode, years }: Props) => (
    <div style={styles.grid}>
        <div>
            <label style={styles.label}>VIN (17 Characters)</label>
            <input name="vin" value={formData.vin} onChange={handleChange} maxLength={17} minLength={17} required pattern="[A-HJ-NPR-Z0-9]{17}" className="modern-input" placeholder="XXXXXXXXXXXXXXXXX" disabled={isEditMode} autoFocus />
        </div>
        <div>
            <label style={styles.label}>Year</label>
            <select name="year" value={formData.year} onChange={handleChange} className="modern-input" required>
                {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
        </div>
        <div style={styles.halfGrid}>
            <div>
                <label style={styles.label}>Make</label>
                <input name="make" value={formData.make} onChange={handleChange} className="modern-input" placeholder="e.g. Porsche" required />
            </div>
            <div>
                <label style={styles.label}>Model</label>
                <input name="model" value={formData.model} onChange={handleChange} className="modern-input" placeholder="e.g. 911 GT3" required />
            </div>
        </div>
    </div>
);
