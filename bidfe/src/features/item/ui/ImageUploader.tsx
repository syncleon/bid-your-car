import { type ChangeEvent } from "react";
import type { ItemImageDto } from "../types";

interface Props {
    existingImages: ItemImageDto[];
    newPreviews: string[];
    onAddFiles: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemoveExisting: (id: string) => void;
    onRemoveNew: (index: number) => void;
}

export const ImageUploader = ({
                                  existingImages,
                                  newPreviews,
                                  onAddFiles,
                                  onRemoveExisting,
                                  onRemoveNew
                              }: Props) => {

    const totalImages = existingImages.length + newPreviews.length;
    const hasImages = totalImages > 0;

    return (
        <div className="image-uploader-wrapper">
            <style>{`
                .upload-zone { border: 2px dashed #e2e8f0; background: #f8fafc; transition: all 0.2s ease; }
                .upload-zone:hover { border-color: #3b82f6; background: #eff6ff; }
                .gallery-grid { display: flex; flex-direction: column; gap: 24px; width: 100%; }
                .gallery-item { position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: transform 0.2s; background: #e2e8f0; width: 100%; aspect-ratio: 16/9; }
                .gallery-img { width: 100%; height: 100%; object-fit: cover; }
                .delete-btn { opacity: 1; transition: all 0.2s ease; }
                .gallery-item:hover .delete-btn { background-color: #ef4444; color: white; }
                .mini-upload-bar { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 20px; border-radius: 12px; cursor: pointer; margin-top: 10px; }
            `}</style>

            <div style={styles.header}>
                <div>
                    <span style={styles.title}>Vehicle Photos</span>
                    <span style={styles.counter}>{totalImages} uploaded</span>
                </div>
            </div>

            <div className="gallery-grid" style={{ marginBottom: hasImages ? "24px" : "0" }}>
                {/* Existing Images (From Server) */}
                {existingImages.map((img, index) => (
                    <div key={img.id} className="gallery-item">
                        {/* UPDATE: Use previewUrl (High Res) instead of thumbnail */}
                        <img
                            src={img.previewUrl || img.originalUrl}
                            alt="Vehicle"
                            className="gallery-img"
                        />
                        {index === 0 && <div style={styles.mainBadge}><StarIcon /> Main Cover</div>}
                        <button type="button" onClick={() => onRemoveExisting(img.id)} className="delete-btn" style={styles.deleteBtn} title="Remove photo">
                            <TrashIcon />
                        </button>
                    </div>
                ))}

                {/* New Uploads (Local Previews) */}
                {newPreviews.map((url, index) => {
                    const globalIndex = existingImages.length + index;
                    return (
                        <div key={url} className="gallery-item">
                            <img src={url} alt="New Upload" className="gallery-img" />
                            {globalIndex === 0 && <div style={styles.mainBadge}><StarIcon /> Main Cover</div>}
                            <button type="button" onClick={() => onRemoveNew(index)} className="delete-btn" style={styles.deleteBtn}>
                                <TrashIcon />
                            </button>
                        </div>
                    );
                })}
            </div>

            {hasImages ? (
                <label className="upload-zone mini-upload-bar">
                    <input type="file" multiple accept="image/*" onChange={onAddFiles} style={{ display: "none" }} />
                    <PlusIcon />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>Add More Photos</span>
                </label>
            ) : (
                <label className="upload-zone" style={styles.bigDropZone}>
                    <input type="file" multiple accept="image/*" onChange={onAddFiles} style={{ display: "none" }} />
                    <div style={styles.iconCircle}><CameraIcon /></div>
                    <div style={{ textAlign: "center" }}>
                        <span style={styles.uploadTitle}>Click to upload photos</span>
                        <span style={styles.uploadSubtitle}>Supports JPG, PNG, WEBP • Max 10MB</span>
                    </div>
                </label>
            )}
        </div>
    );
};

// ... (Icons and Styles remain the same)
const styles = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" },
    title: { fontSize: "16px", fontWeight: 700, color: "#1e293b", marginRight: "12px" },
    counter: { fontSize: "13px", fontWeight: 500, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 10px", borderRadius: "12px" },
    bigDropZone: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "16px", padding: "40px", borderRadius: "16px", cursor: "pointer" },
    iconCircle: { width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" },
    uploadTitle: { display: "block", fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" },
    uploadSubtitle: { fontSize: "14px", color: "#64748b" },
    mainBadge: { position: "absolute" as const, top: "16px", left: "16px", backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", color: "#fff", fontSize: "12px", fontWeight: 700, padding: "8px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", pointerEvents: "none" as const, border: "1px solid rgba(255,255,255,0.2)" },
    deleteBtn: { position: "absolute" as const, top: "16px", right: "16px", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "white", color: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }
};

const CameraIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>);
const TrashIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const PlusIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const StarIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);