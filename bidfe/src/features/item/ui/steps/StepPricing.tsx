import type { ChangeEvent } from "react";
import { styles } from "../styles";

import type { ItemFormData } from "../types";

interface Props {
    formData: ItemFormData;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const StepPricing = ({ formData, handleChange }: Props) => (
    <div style={styles.grid}>
        <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)", transition: "background-color 0.3s ease, border-color 0.3s ease" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                <input
                    type="checkbox"
                    name="isNoReserve"
                    checked={formData.isNoReserve}
                    onChange={handleChange}
                    style={{ width: "22px", height: "22px", accentColor: "var(--color-success-text)" }}
                />
                No Reserve (Sells to the highest bidder!)
            </label>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "8px 0 0 34px", lineHeight: 1.5 }}>
                No Reserve auctions generate significantly more interest and early bidding activity.
            </p>
        </div>

        {!formData.isNoReserve && (
            <div style={{ marginTop: "16px" }}>
                <label style={styles.label}>Reserve Price (Minimum acceptable bid)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: "16px", color: "var(--text-primary)", fontWeight: 700, fontSize: "16px" }}>$</span>
                    <input
                        type="number"
                        name="reservePrice"
                        value={formData.reservePrice}
                        onChange={handleChange}
                        className="modern-input"
                        style={{ paddingLeft: "32px", fontSize: "18px", fontWeight: 600 }}
                        placeholder="50000"
                        min={1}
                        required={!formData.isNoReserve}
                    />
                </div>
                <p style={styles.helperText}>Hidden from buyers. If bidding does not reach this amount, the vehicle will not sell.</p>
            </div>
        )}
    </div>
);
