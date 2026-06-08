import type { ChangeEvent } from "react";
import { styles } from "../styles";
import { ImageUploader } from "../ImageUploader";

import type { ItemFormData } from "../types";

interface Props {
    formData: ItemFormData;
    previews: string[];
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleRemoveExisting: (id: string) => void;
    handleRemoveNew: (index: number) => void;
}

export const StepPhotos = ({ formData, previews, handleFileChange, handleRemoveExisting, handleRemoveNew }: Props) => (
    <div>
        <ImageUploader
            existingImages={formData.images}
            newPreviews={previews}
            onAddFiles={handleFileChange}
            onRemoveExisting={handleRemoveExisting}
            onRemoveNew={handleRemoveNew}
        />
        <p style={{ ...styles.helperText, background: "color-mix(in srgb, var(--color-primary) 10%, transparent)", padding: "12px", borderRadius: "8px", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)", color: "var(--text-primary)" }}>
            <span style={{ fontWeight: 700, marginRight: "8px", color: "var(--color-primary)" }}>Pro Tip:</span>
            High-quality, well-lit photos significantly increase auction engagement and final bids. The first image uploaded will be used as the main thumbnail.
        </p>
    </div>
);
