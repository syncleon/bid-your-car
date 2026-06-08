import type { ChangeEvent } from "react";
import { styles } from "../styles";
import { Autocomplete } from "../../../../shared/ui/Autocomplete";
import type { ConditionGrade } from "../../types";
import type { ItemFormData } from "../types";

interface Props {
    formData: ItemFormData;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    conditionGrades: { value: ConditionGrade; label: string }[];
    titleStatuses: string[];
}

export const StepCondition = ({ formData, handleChange, conditionGrades, titleStatuses }: Props) => {
    const emit = (name: string, value: string) =>
        handleChange({ target: { name, value } } as ChangeEvent<HTMLInputElement>);

    return (
        <div style={styles.grid}>
            <div style={styles.halfGrid}>
                <div>
                    <label style={styles.label}>Condition Grade</label>
                    <Autocomplete
                        name="condition"
                        value={conditionGrades.find(c => c.value === formData.condition)?.label || ""}
                        options={conditionGrades.map(c => c.label)}
                        onChange={(val) => {
                            const found = conditionGrades.find(c => c.label === val);
                            if (found) emit("condition", found.value);
                        }}
                        placeholder="Select condition…"
                        allowCustom={false}
                    />
                </div>
                <div>
                    <label style={styles.label}>Title Status</label>
                    <Autocomplete
                        name="titleStatus"
                        value={formData.titleStatus}
                        options={titleStatuses}
                        onChange={(val) => emit("titleStatus", val)}
                        placeholder="Select title status…"
                        allowCustom={false}
                    />
                </div>
            </div>

            <div style={{ display: "flex", gap: "24px", marginTop: "8px", marginBottom: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    <input
                        type="checkbox"
                        name="hasServiceHistory"
                        checked={formData.hasServiceHistory}
                        onChange={handleChange}
                        style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
                    />
                    Includes Service History
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    <input
                        type="checkbox"
                        name="isModified"
                        checked={formData.isModified}
                        onChange={handleChange}
                        style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
                    />
                    Vehicle is Modified
                </label>
            </div>

            <div>
                <label style={styles.label}>Description & Story</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="modern-input modern-textarea"
                    placeholder="Tell us about the car's history, flaws, condition, and any modifications..."
                />
            </div>
        </div>
    );
};
