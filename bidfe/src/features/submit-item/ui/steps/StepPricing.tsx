import type { ChangeEvent } from "react";
import { styles } from "../styles";

interface Props {
    formData: any;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const StepPricing = ({ formData, handleChange }: Props) => (
    <div style={styles.grid}>
        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', transition: 'background-color 0.3s ease, border-color 0.3s ease' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <input
                    type="checkbox"
                    name="isNoReserve"
                    checked={formData.isNoReserve}
                    onChange={handleChange}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-success-text)' }}
                />
                No Reserve (Sells to the highest bidder!)
            </label>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0 30px' }}>
                No Reserve auctions generate significantly more interest and early bidding activity.
            </p>
        </div>

        {!formData.isNoReserve && (
            <div style={{ marginTop: '12px' }}>
                <label style={styles.label}>Reserve Price (Minimum acceptable bid)</label>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                    <input
                        type="number"
                        name="reservePrice"
                        value={formData.reservePrice}
                        onChange={handleChange}
                        style={{ ...styles.input, paddingLeft: '28px' }}
                        placeholder="50000"
                    />
                </div>
                <p style={styles.helperText}>Hidden from buyers. If bidding does not reach this amount, the vehicle will not sell.</p>
            </div>
        )}
    </div>
);
