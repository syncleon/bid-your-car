import type { ChangeEvent } from "react";
import { ImageUploader } from "../ImageUploader";
import { styles } from "../styles";

interface Props {
    formData: any;
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
        <p style={styles.helperText}>
            Tip: High-quality photos significantly increase auction engagement. The first image uploaded will be used as the main thumbnail.
        </p>
    </div>
);
