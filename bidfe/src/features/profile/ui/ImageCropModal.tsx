import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { AppDialog } from "../../../shared/ui/dialog/AppDialog";
import { getCroppedImg } from "../../../shared/utils/cropImage";
import "./ImageCropModal.css";

interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onCropCompleteAction: (croppedFile: File) => void;
}

export const ImageCropModal = ({ isOpen, imageSrc, onClose, onCropCompleteAction }: ImageCropModalProps) => {
type Area = { width: number; height: number; x: number; y: number };

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImageFile) {
                onCropCompleteAction(croppedImageFile);
            }
        } catch (e) {
            console.error("Failed to crop image:", e);
        } finally {
            setIsProcessing(false);
            onClose();
        }
    };

    return (
        <AppDialog isOpen={isOpen && !!imageSrc} onClose={onClose} disableLightDismiss={true}>
            <h2 className="dialog-title">Adjust Profile Photo</h2>
            <div className="crop-modal-content">
                <div className="crop-container">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    )}
                </div>
                <div className="crop-controls">
                    <div className="crop-slider-row">
                        <span>Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-label="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="crop-actions">
                    <button className="dialog-btn dialog-btn-cancel" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </button>
                    <button className="dialog-btn dialog-btn-confirm" onClick={handleSave} disabled={isProcessing}>
                        {isProcessing ? "Processing..." : "Apply"}
                    </button>
                </div>
            </div>
        </AppDialog>
    );
};
