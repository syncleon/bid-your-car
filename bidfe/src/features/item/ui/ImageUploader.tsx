import { type ChangeEvent } from "react";
import type { ItemImageDto } from "../types";

interface Props {
    existingImages: ItemImageDto[];
    newPreviews: string[];
    onAddFiles: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemoveExisting: (id: string) => void;
    onRemoveNew: (index: number) => void;
}

export const ImageUploader = ({ existingImages, newPreviews, onAddFiles, onRemoveExisting, onRemoveNew }: Props) => {

    const totalImages = existingImages.length + newPreviews.length;

    return (
        <div>
            {/* 1. Upload Trigger */}
            <label style={styles.dropZone}>
                <input type="file" multiple accept="image/*" onChange={onAddFiles} style={{ display: "none" }} />
                <div style={styles.iconBox}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>
                <div>
                    <span style={styles.uploadText}>Click to Upload Photos</span>
                    <div style={styles.uploadSubtext}>JPG, PNG or WEBP (Max 10MB)</div>
                </div>
            </label>

            {/* 2. Gallery Stack */}
            {totalImages > 0 && (
                <div style={styles.container}>
                    <div style={styles.helperRow}>
                        <span style={styles.countBadge}>{totalImages} Photos</span>
                        <span style={styles.helperText}>First photo is the main cover.</span>
                    </div>

                    <div style={styles.grid}>
                        {/* A. Existing Images */}
                        {existingImages.map((img, index) => (
                            <div key={img.id} style={styles.card}>
                                <img
                                    src={img.thumbnailUrl}
                                    alt={`Vehicle ${index + 1}`}
                                    style={styles.img}
                                />
                                {index === 0 && <span style={styles.mainBadge}>Main Cover</span>}
                                <button type="button" onClick={() => onRemoveExisting(img.id)} style={styles.deleteBtn}>
                                    &times;
                                </button>
                            </div>
                        ))}

                        {/* B. New Uploads */}
                        {newPreviews.map((url, index) => {
                            const globalIndex = existingImages.length + index;
                            return (
                                <div key={url} style={styles.card}>
                                    <img
                                        src={url}
                                        alt="New Upload"
                                        style={styles.img}
                                    />
                                    {globalIndex === 0 && <span style={styles.mainBadge}>Main Cover</span>}
                                    <button type="button" onClick={() => onRemoveNew(index)} style={styles.deleteBtn}>
                                        &times;
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    dropZone: {
        display: "flex", alignItems: "center", gap: "16px", padding: "24px",
        backgroundColor: "#f9fafb", border: "2px dashed #e5e7eb", borderRadius: "8px",
        cursor: "pointer", transition: "border-color 0.2s, background 0.2s", marginBottom: "32px",
    },
    iconBox: {
        width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#fff",
        border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", color: "#111",
    },
    uploadText: { display: "block", fontWeight: 600, fontSize: "15px", color: "#111", marginBottom: "4px" },
    uploadSubtext: { fontSize: "13px", color: "#6b7280" },

    container: { animation: "fadeIn 0.3s ease-in-out" },
    helperRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #eee" },
    countBadge: { fontSize: "13px", fontWeight: 700, color: "#111", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    helperText: { fontSize: "13px", color: "#666" },

    grid: { display: "grid", gridTemplateColumns: "1fr", gap: "32px" },
    card: {
        position: "relative" as const, aspectRatio: "16/9", borderRadius: "8px",
        overflow: "hidden", backgroundColor: "#eee",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    },
    img: { width: "100%", height: "100%", objectFit: "cover" as const },
    mainBadge: {
        position: "absolute" as const, bottom: "0", left: "0", right: "0",
        backgroundColor: "rgba(0,0,0,0.75)", color: "#fff", fontSize: "12px", fontWeight: 700,
        textAlign: "center" as const, padding: "8px 0", textTransform: "uppercase" as const,
        backdropFilter: "blur(4px)", pointerEvents: "none" as const, letterSpacing: "1px"
    },
    deleteBtn: {
        position: "absolute" as const, top: "12px", right: "12px", width: "32px", height: "32px",
        borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.9)", color: "#fff",
        border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px", lineHeight: 0, cursor: "pointer", paddingBottom: "2px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
    }
};