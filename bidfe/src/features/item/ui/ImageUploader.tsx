import { useState, type ChangeEvent } from "react";
import type { ItemImageDto } from "../types";

interface Props {
    existingImages: ItemImageDto[];
    newPreviews: string[];
    onAddFiles: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemoveExisting: (id: string) => void;
    onRemoveNew: (index: number) => void;
}

export const ImageUploader = ({ existingImages, newPreviews, onAddFiles, onRemoveExisting, onRemoveNew }: Props) => {
    // Track which image is currently open in full view
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const totalImages = existingImages.length + newPreviews.length;

    // Helper to extract the high-res URL if available, otherwise fallback to thumbnail
    const getFullUrl = (img: ItemImageDto) => (img as any).url || img.thumbnailUrl;

    return (
        <div>
            {/* 1. Drop Zone */}
            <label style={styles.dropZone}>
                <div style={styles.iconCircle}>📷</div>
                <div style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: 600, color: "#2563eb" }}>Click to upload photos</span>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                        JPG, PNG or WEBP. Max 10MB each.
                    </p>
                </div>
                <input type="file" multiple accept="image/*" onChange={onAddFiles} style={{ display: "none" }} />
            </label>

            {/* 2. Image Grid */}
            {totalImages > 0 && (
                <div style={styles.grid}>
                    {/* Existing Images */}
                    {existingImages.map((img, index) => (
                        <div key={img.id} style={styles.previewCard}>
                            <img
                                src={img.thumbnailUrl}
                                alt="Vehicle"
                                style={styles.image}
                                onClick={() => setSelectedImage(getFullUrl(img))}
                            />
                            {index === 0 && <span style={styles.coverBadge}>Main Photo</span>}
                            <button type="button" onClick={() => onRemoveExisting(img.id)} style={styles.removeBtn} title="Delete">
                                &times;
                            </button>
                        </div>
                    ))}

                    {/* New Uploads */}
                    {newPreviews.map((url, index) => (
                        <div key={url} style={styles.previewCard}>
                            <img
                                src={url}
                                alt="New upload"
                                style={styles.image}
                                onClick={() => setSelectedImage(url)}
                            />
                            <span style={styles.newBadge}>Ready to upload</span>
                            <button type="button" onClick={() => onRemoveNew(index)} style={styles.removeBtn} title="Remove">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 3. Full Screen Lightbox Modal */}
            {selectedImage && (
                <div style={styles.lightboxOverlay} onClick={() => setSelectedImage(null)}>
                    <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage} alt="Full size" style={styles.lightboxImg} />
                        <button style={styles.closeLightboxBtn} onClick={() => setSelectedImage(null)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    dropZone: {
        border: "2px dashed #cbd5e1",
        borderRadius: "12px",
        padding: "32px",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        cursor: "pointer",
        backgroundColor: "#f8fafc",
        transition: "background 0.2s",
    },
    iconCircle: {
        fontSize: "24px",
        background: "#e0f2fe",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: "16px",
        marginTop: "24px",
    },
    previewCard: {
        position: "relative" as const,
        aspectRatio: "4/3",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        background: "#fff",
        // UX: Indicate clickable
        cursor: "zoom-in",
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        transition: "transform 0.2s"
    },
    removeBtn: {
        position: "absolute" as const, top: 4, right: 4,
        background: "rgba(255,255,255,0.9)", color: "#ef4444",
        border: "none", borderRadius: "4px", width: "24px", height: "24px",
        cursor: "pointer", fontWeight: "bold", fontSize: "18px", lineHeight: 1,
        zIndex: 2 // Ensure button is above image click area
    },
    coverBadge: {
        position: "absolute" as const, bottom: 0, left: 0, right: 0,
        background: "rgba(0,0,0,0.6)", color: "white", fontSize: "10px",
        padding: "4px", textAlign: "center" as const, textTransform: "uppercase" as const,
        pointerEvents: "none" as const
    },
    newBadge: {
        position: "absolute" as const, bottom: 4, left: 4,
        background: "#22c55e", color: "white", fontSize: "10px",
        padding: "2px 6px", borderRadius: "4px", fontWeight: 600,
        pointerEvents: "none" as const
    },

    // --- Lightbox Styles ---
    lightboxOverlay: {
        position: "fixed" as const,
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(4px)",
        cursor: "zoom-out"
    },
    lightboxContent: {
        position: "relative" as const,
        maxWidth: "100%",
        maxHeight: "100%",
        cursor: "default"
    },
    lightboxImg: {
        maxWidth: "90vw",
        maxHeight: "90vh",
        objectFit: "contain" as const,
        borderRadius: "4px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
    },
    closeLightboxBtn: {
        position: "absolute" as const,
        top: "-40px",
        right: "0px",
        background: "none",
        border: "none",
        color: "white",
        fontSize: "32px",
        cursor: "pointer",
        lineHeight: 1
    }
};