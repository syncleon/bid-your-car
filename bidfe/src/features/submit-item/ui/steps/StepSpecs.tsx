import type { ChangeEvent } from "react";
import { styles } from "../styles";

interface Props {
    formData: any;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    transmissions: string[];
    drivetrains: string[];
    fuelTypes: string[];
    bodyStyles: string[];
}

export const StepSpecs = ({ formData, handleChange, transmissions, drivetrains, fuelTypes, bodyStyles }: Props) => (
    <div style={styles.grid}>
        <div style={styles.halfGrid}>
            <div>
                <label style={styles.label}>Mileage</label>
                <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="modern-input" placeholder="e.g. 15000" min={0} required />
            </div>
            <div>
                <label style={styles.label}>Location</label>
                <input name="location" value={formData.location} onChange={handleChange} className="modern-input" placeholder="City, State, Zip" required />
            </div>
        </div>

        <div style={styles.halfGrid}>
            <div>
                <label style={styles.label}>Engine</label>
                <input name="engine" value={formData.engine} onChange={handleChange} className="modern-input" placeholder="e.g. 4.0L Flat-6" required />
            </div>
            <div>
                <label style={styles.label}>Horsepower</label>
                <input type="number" name="horsepower" value={formData.horsepower} onChange={handleChange} className="modern-input" placeholder="e.g. 500" min={1} required />
            </div>
        </div>

        <div style={styles.halfGrid}>
            <div>
                <label style={styles.label}>Transmission</label>
                <select name="transmission" value={formData.transmission} onChange={handleChange} style={styles.select}>
                    <option value="">Select...</option>
                    {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div>
                <label style={styles.label}>Drivetrain</label>
                <select name="drivetrain" value={formData.drivetrain} onChange={handleChange} style={styles.select}>
                    <option value="">Select...</option>
                    {drivetrains.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
        </div>

        <div style={styles.halfGrid}>
            <div>
                <label style={styles.label}>Fuel Type</label>
                <select name="fuelType" value={formData.fuelType} onChange={handleChange} style={styles.select}>
                    <option value="">Select...</option>
                    {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
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
                    {bodyStyles.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>
            <div>
                <label style={styles.label}>Engine Details</label>
                <input name="engine" value={formData.engine} onChange={handleChange} style={styles.input} placeholder="e.g. 4.0L Flat-6" />
            </div>
        </div>
    </div>
);
