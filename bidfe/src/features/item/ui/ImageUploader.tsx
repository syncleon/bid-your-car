import { type ChangeEvent, useState } from "react";
import type { ItemImageDto } from "../types";

interface Props {
    existingImages: ItemImageDto[];
    newPreviews: string[];
    onAddFiles: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemoveExisting: (id: string) => void;
    onRemoveNew: (index: number) => void;
    onReorderNew?: (dragIndex: number, hoverIndex: number) => void;
}

export const ImageUploader = ({
                                  existingImages,
                                  newPreviews,
                                  onAddFiles,
                                  onRemoveExisting,
                                  onRemoveNew,
                                  onReorderNew
                              }: Props) => {

    const [isDragging, setIsDragging] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index || !onReorderNew) return;
        onReorderNew(draggedIndex, index);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as ChangeEvent<HTMLInputElement>;
            onAddFiles(fakeEvent);
        }
    };

    const totalImages = existingImages.length + newPreviews.length;
    const hasImages = totalImages > 0;
    const hasMainInExisting = existingImages.some(img => img.category === "MAIN");

    return (
        <div className="image-uploader-wrapper">
            <style>{`
                .upload-zone { border: 2px dashed rgba(255,255,255,0.2); background: rgba(255,255,255,0.03); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); backdrop-filter: blur(8px); }
                .upload-zone.dragging { border-color: var(--accent-color, #ff5e00); background: rgba(255,94,0,0.1); transform: scale(1.02); }
                .upload-zone:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.08); }
                .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; width: 100%; }
                .gallery-item { position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); transition: transform 0.2s; background: rgba(255,255,255,0.05); width: 100%; aspect-ratio: 16/9; }
                .gallery-img { width: 100%; height: 100%; object-fit: cover; }
                .delete-btn { opacity: 0; transition: all 0.2s ease; transform: scale(0.8); }
                .gallery-item:hover .delete-btn { opacity: 1; transform: scale(1); background-color: #ef4444; color: white; }
                .mini-upload-bar { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 20px; border-radius: 12px; cursor: pointer; margin-top: 10px; }
            `}</style>

            <div style={styles.header}>
                <div>
                    <span style={styles.title}>Vehicle Photos</span>
                    <span style={styles.counter}>{totalImages} uploaded</span>
                </div>
            </div>

            <div className="gallery-grid" style={{ marginBottom: hasImages ? "24px" : "0" }}>
                {existingImages.map((img) => (
                    <div key={img.id} className="gallery-item">
                        <img
                            src={img.url}
                            alt={`Vehicle ${img.category}`}
                            className="gallery-img"
                        />
                        {img.category === "MAIN" ? (
                            <div style={styles.mainBadge}><StarIcon /> Main Cover</div>
                        ) : (
                            <div style={styles.categoryBadge}>{img.category}</div>
                        )}
                        <button type="button" onClick={() => onRemoveExisting(img.id)} className="delete-btn" style={styles.deleteBtn} title="Remove photo">
                            <TrashIcon />
                        </button>
                    </div>
                ))}

                {newPreviews.map((url, index) => {
                    const isNewMain = !hasMainInExisting && index === 0;
                    const predictedCategory = isNewMain ? "MAIN" : "EXTERIOR";

                    return (
                        <div 
                            key={url} 
                            className="gallery-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleItemDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            style={{
                                opacity: draggedIndex === index ? 0.5 : 1,
                                cursor: 'grab',
                                border: isNewMain ? '2px solid var(--accent-color, #ff5e00)' : 'none'
                            }}
                        >
                            <img src={url} alt="New Upload" className="gallery-img" />
                            {isNewMain ? (
                                <div style={styles.mainBadge}><StarIcon /> Main Cover (Unsaved)</div>
                            ) : (
                                <div style={styles.categoryBadge}>{predictedCategory} (Unsaved)</div>
                            )}
                            <button type="button" onClick={() => onRemoveNew(index)} className="delete-btn" style={styles.deleteBtn}>
                                <TrashIcon />
                            </button>
                        </div>
                    );
                })}
            </div>

            {hasImages ? (
                <label 
                    className={`upload-zone mini-upload-bar ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input type="file" multiple accept="image/*" onChange={onAddFiles} style={{ display: "none" }} />
                    <PlusIcon />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Drop more photos here or click to add</span>
                </label>
            ) : (
                <label 
                    className={`upload-zone ${isDragging ? 'dragging' : ''}`} 
                    style={styles.bigDropZone}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input type="file" multiple accept="image/*" onChange={onAddFiles} style={{ display: "none" }} />
                    <div style={styles.iconCircle}><CameraIcon /></div>
                    <div style={{ textAlign: "center" }}>
                        <span style={styles.uploadTitle}>Drag & drop photos here, or click to browse</span>
                        <span style={styles.uploadSubtitle}>High-res JPG, PNG, WEBP • Max 10MB</span>
                    </div>
                </label>
            )}
        </div>
    );
};

const styles = {
    header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" },
    title: { fontSize: "18px", fontWeight: 700, color: "white", marginRight: "12px" },
    counter: { fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", backgroundColor: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "6px" },
    bigDropZone: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "16px", padding: "48px", borderRadius: "6px", cursor: "pointer" },
    iconCircle: { width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" },
    uploadTitle: { display: "block", fontSize: "18px", fontWeight: 600, color: "white", marginBottom: "8px" },
    uploadSubtitle: { fontSize: "14px", color: "rgba(255,255,255,0.5)" },
    mainBadge: { position: "absolute" as const, top: "12px", left: "12px", backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)", color: "#fbbf24", fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px", pointerEvents: "none" as const, border: "1px solid rgba(251,191,36,0.3)" },
    categoryBadge: { position: "absolute" as const, top: "12px", left: "12px", backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)", color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", padding: "6px 10px", borderRadius: "6px", pointerEvents: "none" as const, border: "1px solid rgba(255,255,255,0.2)" },
    deleteBtn: { position: "absolute" as const, top: "12px", right: "12px", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }
};

const CameraIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>);
const TrashIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const PlusIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const StarIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
