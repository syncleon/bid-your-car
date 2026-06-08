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
                <select name="condition" value={formData.condition} onChange={handleChange} className="modern-input" required>
                    {conditionGrades.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
            </div>
            <div>
                <label style={styles.label}>Title Status</label>
                <select name="titleStatus" value={formData.titleStatus} onChange={handleChange} className="modern-input" required>
                    {titleStatuses.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>

        <div style={styles.halfGrid}>
            <div>
                <label style={styles.label}>Exterior Color</label>
                <input name="exteriorColor" value={formData.exteriorColor} onChange={handleChange} className="modern-input" placeholder="e.g. Guards Red" required />
            </div>
            <div>
                <label style={styles.label}>Interior Color</label>
                <input name="interiorColor" value={formData.interiorColor} onChange={handleChange} className="modern-input" placeholder="e.g. Black Leather" required />
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
            <label style={styles.label}>Detailed Description</label>
            <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="modern-input modern-textarea"
                placeholder="Highlight options, known flaws, recent maintenance, ownership history..."
                required
            />
        </div>
        <div>
            <label style={styles.label}>Highlights</label>
            <textarea name="highlights" value={formData.highlights || ''} onChange={handleChange} style={styles.textarea} placeholder="List the standout features and equipment..." />
        </div>
        <div>
            <label style={styles.label}>Known Flaws</label>
            <textarea name="knownFlaws" value={formData.knownFlaws || ''} onChange={handleChange} style={styles.textarea} placeholder="Describe any cosmetic or mechanical imperfections..." />
        </div>
        <div>
            <label style={styles.label}>Recent Service History</label>
            <textarea name="recentServiceHistory" value={formData.recentServiceHistory || ''} onChange={handleChange} style={styles.textarea} placeholder="List recent maintenance, oil changes, or major repairs..." />
        </div>
        <div>
            <label style={styles.label}>Other Items Included in Sale</label>
            <textarea name="otherItemsIncluded" value={formData.otherItemsIncluded || ''} onChange={handleChange} style={styles.textarea} placeholder="e.g. 2 keys, owner's manuals, car cover..." />
        </div>
    </div>
);
