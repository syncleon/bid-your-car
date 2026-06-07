import type { ChangeEvent } from "react";
import { styles } from "../styles";

interface Props {
    formData: any;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    conditionGrades: { value: string; label: string }[];
    titleStatuses: string[];
}

export const StepCondition = ({ formData, handleChange, conditionGrades, titleStatuses }: Props) => (
    <div style={styles.grid}>
        <div style={styles.halfGrid}>
            <div>
                <label style={styles.label}>Condition Grade</label>
                <select name="condition" value={formData.condition} onChange={handleChange} style={styles.select}>
                    {conditionGrades.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
            </div>
            <div>
                <label style={styles.label}>Title Status</label>
                <select name="titleStatus" value={formData.titleStatus} onChange={handleChange} style={styles.select}>
                    {titleStatuses.map(t => <option key={t} value={t}>{t}</option>)}
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
);
