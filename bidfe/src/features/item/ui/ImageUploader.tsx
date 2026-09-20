import { type ChangeEvent, useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Cropper from 'react-easy-crop';
import getCroppedImg from './canvasUtils';

import type { ItemImageDto } from "../types";

interface Props {
    existingImages: ItemImageDto[];
    newPreviews: string[];
    originalPreviews?: string[];
    onAddFiles: (e: ChangeEvent<HTMLInputElement>) => void;
    onRemoveExisting: (id: string) => void;
    onRemoveNew: (index: number) => void;
    onReorderNew?: (dragIndex: number, hoverIndex: number) => void;
    onReplaceNewFile?: (index: number, newFile: File, newPreview: string) => void;
    onReplaceExistingWithNew?: (existingId: string, newFile: File, newPreview: string) => void;
}

export const ImageUploader = ({
                                  existingImages,
                                  newPreviews,
                                  originalPreviews,
                                  onAddFiles,
                                  onRemoveExisting,
                                  onRemoveNew,
                                  onReorderNew,
                                  onReplaceNewFile,
                                  onReplaceExistingWithNew
                              }: Props) => {

    const [isDragging, setIsDragging] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const [savedCropStates, setSavedCropStates] = useState<Record<string, { crop: { x: number, y: number }, zoom: number, rotation: number }>>({});
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
    const [cropContext, setCropContext] = useState<{type: 'new', index: number} | {type: 'existing', id: string} | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const prevPreviewsLength = useRef(newPreviews.length);
    useEffect(() => {
        if (existingImages.length === 0 && prevPreviewsLength.current === 0 && newPreviews.length > 0) {
            // First time uploading images (main image is index 0)
            openCropModal('new', 0, originalPreviews ? originalPreviews[0] : newPreviews[0]);
        }
        prevPreviewsLength.current = newPreviews.length;
    }, [newPreviews.length, existingImages.length]);


    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const openCropModal = (type: 'new' | 'existing', identifier: number | string, imageUrl: string) => {
        setCropContext(type === 'new' ? { type: 'new', index: identifier as number } : { type: 'existing', id: identifier as string });
        setCropImageUrl(imageUrl);
        
        setSavedCropStates(prev => {
            const saved = prev[imageUrl];
            if (saved) {
                setCrop(saved.crop);
                setZoom(saved.zoom);
                setRotation(saved.rotation);
            } else {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
            }
            return prev;
        });

        setCropModalOpen(true);
    };

    const closeCropModal = () => {
        setCropModalOpen(false);
        setCropContext(null);
        setCropImageUrl(null);
    };

    const handleCropSave = async () => {
        if (!cropContext || !croppedAreaPixels || !cropImageUrl) {
            closeCropModal();
            return;
        }

        setSavedCropStates(prev => ({
            ...prev,
            [cropImageUrl]: { crop, zoom, rotation }
        }));

        try {
            const croppedFile = await getCroppedImg(cropImageUrl, croppedAreaPixels, rotation);
            if (!croppedFile) throw new Error("Crop failed");
            
            const newPreviewUrl = URL.createObjectURL(croppedFile);

            if (cropContext.type === 'new' && onReplaceNewFile) {
                onReplaceNewFile(cropContext.index, croppedFile, newPreviewUrl);
            } else if (cropContext.type === 'existing' && onReplaceExistingWithNew) {
                onReplaceExistingWithNew(cropContext.id, croppedFile, newPreviewUrl);
            }
        } catch (e) {
            console.error(e);
        }
        closeCropModal();
    };


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
                
                .crop-btn { opacity: 0; transition: all 0.2s ease; transform: scale(0.8); }
                .gallery-item:hover .crop-btn { opacity: 1; transform: scale(1); }
                .gallery-item:hover .crop-btn:hover { background-color: var(--accent-color, #ff5e00); color: white; }

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
                        <button type="button" onClick={(e) => { e.stopPropagation(); openCropModal('existing', img.id, img.url); }} className="crop-btn" style={styles.cropBtn} title="Crop photo">
                                <CropIcon />
                            </button>
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
                            
                            <button type="button" onClick={(e) => { e.stopPropagation(); openCropModal('new', index, originalPreviews ? originalPreviews[index] : url); }} className="crop-btn" style={styles.cropBtn} title="Crop photo">
                                <CropIcon />
                            </button>

                            <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveNew(index); }} className="delete-btn" style={styles.deleteBtn}>
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
                        <span style={styles.uploadSubtitle}>High-res JPG, PNG, WEBP • Max 10MB<br/>For the best fit in cards, use landscape photos with a 3:2 aspect ratio (e.g. 2400x1600)</span>
                    </div>
                </label>
            )}

            {cropModalOpen && createPortal(
                <div style={styles.cropModalOverlay}>
                    {/* Top Helper Bar */}
                    <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "transparent", zIndex: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px", display: "flex" }}>
                                <CropIcon />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: "white", fontSize: "16px", fontWeight: 600 }}>Crop Photo</h3>
                                <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Drag to move • Scroll to zoom</p>
                            </div>
                        </div>
                        <button type="button" onClick={closeCropModal} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }} title="Close">
                            <XIcon />
                        </button>
                    </div>

                    <div style={styles.cropContainer}>
                        <Cropper
                            image={cropImageUrl || undefined}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={3 / 2}
                            onCropChange={setCrop}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            showGrid={true}
                        />
                    </div>
                    
                    {/* Bottom Controls Bar */}
                    <div style={styles.minimalControlsPanel}>
                        <div style={{ ...styles.sliderGroup, flex: 1 }}>
                            <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.1))} style={styles.iconBtn} title="Zoom Out"><MinusIcon /></button>
                            <input 
                                type="range" 
                                value={zoom} 
                                min={1} 
                                max={3} 
                                step={0.05} 
                                aria-label="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))} 
                                style={styles.slider}
                            />
                            <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.1))} style={styles.iconBtn} title="Zoom In"><PlusIcon /></button>
                        </div>
                        
                        <div style={styles.actionsGroup}>
                            <button 
                                type="button" 
                                onClick={() => { setCrop({x:0, y:0}); setZoom(1); setRotation(0); }} 
                                style={styles.actionBtn} 
                                title="Return to Original"
                            >
                                <ResetIcon />
                                <span style={{ marginLeft: "8px", fontSize: "14px" }}>Original</span>
                            </button>
                            
                            <button type="button" onClick={() => setRotation(r => r + 90)} style={styles.actionBtn} title="Rotate 90°">
                                <RotateIcon />
                                <span style={{ marginLeft: "8px", fontSize: "14px" }}>Rotate</span>
                            </button>
                            
                            <button type="button" onClick={closeCropModal} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", padding: "10px 16px", fontSize: "15px", fontWeight: 500, cursor: "pointer", marginRight: "8px" }}>Cancel</button>
                            <button type="button" onClick={handleCropSave} style={styles.primarySaveBtn}>Apply Crop</button>
                        </div>
                    </div>
                </div>
            , document.body)}

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
    uploadSubtitle: { fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.5" },
    mainBadge: { position: "absolute" as const, top: "12px", left: "12px", backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)", color: "#fbbf24", fontSize: "11px", fontWeight: 700, padding: "6px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px", pointerEvents: "none" as const, border: "1px solid rgba(251,191,36,0.3)" },
    categoryBadge: { position: "absolute" as const, top: "12px", left: "12px", backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)", color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", padding: "6px 10px", borderRadius: "6px", pointerEvents: "none" as const, border: "1px solid rgba(255,255,255,0.2)" },
    
    cropBtn: { position: "absolute" as const, top: "12px", right: "56px", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" },
    cropModalOverlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000000", zIndex: 9999, display: "flex", flexDirection: "column" as const },
    cropContainer: { position: "relative" as const, flex: 1 },
    minimalControlsPanel: { padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "transparent" },
    sliderGroup: { display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "300px" },
    slider: { flex: 1, accentColor: "white", cursor: "pointer" },
    actionsGroup: { display: "flex", alignItems: "center", gap: "8px" },
    primarySaveBtn: { background: "white", border: "none", color: "black", padding: "10px 24px", borderRadius: "100px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "15px", fontWeight: 600, transition: "transform 0.2s" },
    iconBtn: { background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" },
    actionBtn: { background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "10px 16px", borderRadius: "100px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", fontWeight: 500, transition: "background 0.2s" }
,
    deleteBtn: { position: "absolute" as const, top: "12px", right: "12px", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }
};


const XIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

const FlipHorizontalIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"></path><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"></path><line x1="12" y1="20" x2="12" y2="22"></line><line x1="12" y1="14" x2="12" y2="16"></line><line x1="12" y1="8" x2="12" y2="10"></line><line x1="12" y1="2" x2="12" y2="4"></line></svg>);
const FlipVerticalIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"></path><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"></path><line x1="4" y1="12" x2="2" y2="12"></line><line x1="10" y1="12" x2="8" y2="12"></line><line x1="16" y1="12" x2="14" y2="12"></line><line x1="22" y1="12" x2="20" y2="12"></line></svg>);

const ResetIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>);
const RotateIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>);
const MinusIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>);

const CameraIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>);
const CropIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>);
const TrashIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const PlusIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const StarIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
