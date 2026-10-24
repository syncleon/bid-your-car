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
    onReorderExisting?: (dragIndex: number, hoverIndex: number) => void;
    onMoveExisting?: (index: number, direction: 'left' | 'right') => void;
    onSetMainExisting?: (id: string) => void;
    onReorderNew?: (dragIndex: number, hoverIndex: number) => void;
    onMoveNew?: (index: number, direction: 'left' | 'right') => void;
    onSetMainNew?: (index: number) => void;
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
                                  onReorderExisting,
                                  onMoveExisting,
                                  onSetMainExisting,
                                  onReorderNew,
                                  onMoveNew,
                                  onSetMainNew,
                                  onReplaceNewFile,
                                  onReplaceExistingWithNew
                              }: Props) => {

    const [isDragging, setIsDragging] = useState(false);
    
    // Drag-and-drop state for existing images
    const [draggedExistingIndex, setDraggedExistingIndex] = useState<number | null>(null);
    const [dragOverExistingIndex, setDragOverExistingIndex] = useState<number | null>(null);

    // Drag-and-drop state for newly uploaded previews
    const [draggedNewIndex, setDraggedNewIndex] = useState<number | null>(null);
    const [dragOverNewIndex, setDragOverNewIndex] = useState<number | null>(null);

    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
    const [cropContext, setCropContext] = useState<{type: 'new', index: number} | {type: 'existing', id: string} | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const prevPreviewsLength = useRef(newPreviews.length);
    useEffect(() => {
        if (existingImages.length === 0 && prevPreviewsLength.current === 0 && newPreviews.length > 0) {
            // First time uploading images (main image is index 0)
            openCropModal('new', 0, originalPreviews ? originalPreviews[0] : newPreviews[0]);
        }
        prevPreviewsLength.current = newPreviews.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newPreviews.length, existingImages.length]);


    const onCropComplete = useCallback((_croppedArea: unknown, croppedAreaPixels: unknown) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const openCropModal = (type: 'new' | 'existing', identifier: number | string, imageUrl: string) => {
        setCropContext(type === 'new' ? { type: 'new', index: identifier as number } : { type: 'existing', id: identifier as string });
        setCropImageUrl(imageUrl);
        
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);

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

        try {
            const croppedFile = await getCroppedImg(cropImageUrl, croppedAreaPixels, rotation);
            if (!croppedFile) {
                console.error("Crop failed");
                closeCropModal();
                return;
            }
            
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

    // Existing images drag-and-drop handlers
    const handleExistingDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedExistingIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `existing:${index}`);
    };

    const handleExistingDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedExistingIndex === null || draggedExistingIndex === index) return;
        if (onReorderExisting) {
            onReorderExisting(draggedExistingIndex, index);
            setDraggedExistingIndex(index);
        } else {
            setDragOverExistingIndex(index);
        }
    };

    const handleExistingDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedExistingIndex !== null && draggedExistingIndex !== dropIndex && onReorderExisting) {
            onReorderExisting(draggedExistingIndex, dropIndex);
        }
        setDraggedExistingIndex(null);
        setDragOverExistingIndex(null);
    };

    const handleExistingDragEnd = () => {
        setDraggedExistingIndex(null);
        setDragOverExistingIndex(null);
    };

    // New previews drag-and-drop handlers
    const handleNewDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedNewIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `new:${index}`);
    };

    const handleNewDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedNewIndex === null || draggedNewIndex === index) return;
        if (onReorderNew) {
            onReorderNew(draggedNewIndex, index);
            setDraggedNewIndex(index);
        } else {
            setDragOverNewIndex(index);
        }
    };

    const handleNewDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedNewIndex !== null && draggedNewIndex !== dropIndex && onReorderNew) {
            onReorderNew(draggedNewIndex, dropIndex);
        }
        setDraggedNewIndex(null);
        setDragOverNewIndex(null);
    };

    const handleNewDragEnd = () => {
        setDraggedNewIndex(null);
        setDragOverNewIndex(null);
    };

    // Dropzone handlers for uploading files
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
                .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; width: 100%; }
                .gallery-item { position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease; background: rgba(255,255,255,0.05); width: 100%; aspect-ratio: 16/9; cursor: grab; user-select: none; }
                .gallery-item:active { cursor: grabbing; }
                .gallery-item.is-main { border: 2px solid #fbbf24; box-shadow: 0 0 16px rgba(251, 191, 36, 0.3); }
                .gallery-item.is-dragging { opacity: 0.35; transform: scale(0.96); }
                .gallery-item.is-drop-target { border: 2px dashed #fbbf24; background: rgba(251, 191, 36, 0.12); transform: scale(1.03); }
                .gallery-img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
                
                .main-cover-badge { position: absolute; top: 10px; left: 10px; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px); color: #fbbf24; font-size: 11px; font-weight: 700; padding: 5px 9px; border-radius: 6px; display: flex; align-items: center; gap: 5px; border: 1px solid rgba(251, 191, 36, 0.4); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4); z-index: 2; pointer-events: none; }
                .slot-badge { position: absolute; top: 10px; left: 10px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); color: rgba(255, 255, 255, 0.9); font-size: 11px; font-weight: 600; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.18); z-index: 2; pointer-events: none; }

                .card-top-actions { position: absolute; top: 8px; right: 8px; display: flex; align-items: center; gap: 6px; z-index: 3; }
                .crop-btn, .delete-btn { width: 30px; height: 30px; border-radius: 6px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.25); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.85; transition: all 0.2s ease; }
                .crop-btn:hover { background: var(--accent-color, #ff5e00); border-color: var(--accent-color, #ff5e00); opacity: 1; transform: scale(1.08); }
                .delete-btn:hover { background: #ef4444; border-color: #ef4444; opacity: 1; transform: scale(1.08); }

                .card-bottom-bar { position: absolute; bottom: 8px; left: 8px; right: 8px; display: flex; align-items: center; justify-content: space-between; z-index: 3; pointer-events: auto; }
                .set-main-btn { background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px); border: 1px solid rgba(251, 191, 36, 0.5); color: #fbbf24; font-size: 11px; font-weight: 600; padding: 5px 9px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
                .set-main-btn:hover { background: #fbbf24; border-color: #fbbf24; color: #111827; font-weight: 700; transform: scale(1.05); }

                .reorder-arrows { display: flex; align-items: center; gap: 4px; margin-left: auto; }
                .arrow-btn { width: 26px; height: 26px; border-radius: 5px; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.25); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; }
                .arrow-btn:hover { background: rgba(255, 255, 255, 0.25); border-color: rgba(255, 255, 255, 0.6); transform: scale(1.1); }

                .drag-hint-strip { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-bottom: 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 8px 12px; border-radius: 8px; }
                .mini-upload-bar { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 20px; border-radius: 12px; cursor: pointer; margin-top: 10px; }
            `}</style>

            <div style={styles.header}>
                <div>
                    <span style={styles.title}>Vehicle Photos</span>
                    <span style={styles.counter}>{totalImages} {totalImages === 1 ? 'photo' : 'photos'} uploaded</span>
                </div>
            </div>

            {hasImages && (
                <div className="drag-hint-strip">
                    <GripIcon />
                    <span>
                        <strong>Drag photos to reorder</strong>, or click <strong>Make Main</strong> on any image to set it as the primary cover photo. The first photo (#1) is shown on auction cards and search results.
                    </span>
                </div>
            )}

            <div className="gallery-grid" style={{ marginBottom: hasImages ? "24px" : "0" }}>
                {existingImages.map((img, index) => {
                    const isMain = index === 0;
                    const isDraggingThis = draggedExistingIndex === index;
                    const isDropTarget = dragOverExistingIndex === index;

                    return (
                        <div
                            key={img.id}
                            className={`gallery-item ${isMain ? 'is-main' : ''} ${isDraggingThis ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
                            draggable={Boolean(onReorderExisting)}
                            onDragStart={(e) => handleExistingDragStart(e, index)}
                            onDragOver={(e) => handleExistingDragOver(e, index)}
                            onDrop={(e) => handleExistingDrop(e, index)}
                            onDragEnd={handleExistingDragEnd}
                            title={onReorderExisting ? "Drag to reorder photos" : undefined}
                            data-testid={`existing-image-${index}`}
                        >
                            <img
                                src={img.url}
                                alt={`Vehicle ${img.category}`}
                                className="gallery-img"
                            />

                            {/* Main badge or Slot number */}
                            {isMain ? (
                                <div className="main-cover-badge">
                                    <StarIcon /> Main Cover
                                </div>
                            ) : (
                                <div className="slot-badge">
                                    #{index + 1} • {img.category}
                                </div>
                            )}

                            {/* Top right actions: Crop & Delete */}
                            <div className="card-top-actions">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openCropModal('existing', img.id, img.url); }}
                                    className="crop-btn"
                                    title="Crop / Rotate photo"
                                    aria-label="Crop photo"
                                >
                                    <CropIcon />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemoveExisting(img.id); }}
                                    className="delete-btn"
                                    title="Remove photo"
                                    aria-label="Remove photo"
                                >
                                    <TrashIcon />
                                </button>
                            </div>

                            {/* Bottom bar: Make Main button & Reorder arrows */}
                            <div className="card-bottom-bar">
                                {!isMain && onSetMainExisting && (
                                    <button
                                        type="button"
                                        className="set-main-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSetMainExisting(img.id);
                                        }}
                                        title="Make this photo the main cover thumbnail"
                                        data-testid={`make-main-existing-${index}`}
                                    >
                                        <StarIcon /> Make Main
                                    </button>
                                )}

                                <div className="reorder-arrows">
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onMoveExisting) {
                                                    onMoveExisting(index, 'left');
                                                } else if (onReorderExisting) {
                                                    onReorderExisting(index, index - 1);
                                                }
                                            }}
                                            title="Move earlier (to the left)"
                                            aria-label="Move photo left"
                                            data-testid={`move-left-existing-${index}`}
                                        >
                                            <ChevronLeftIcon />
                                        </button>
                                    )}
                                    {index < existingImages.length - 1 && (
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onMoveExisting) {
                                                    onMoveExisting(index, 'right');
                                                } else if (onReorderExisting) {
                                                    onReorderExisting(index, index + 1);
                                                }
                                            }}
                                            title="Move later (to the right)"
                                            aria-label="Move photo right"
                                            data-testid={`move-right-existing-${index}`}
                                        >
                                            <ChevronRightIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {newPreviews.map((url, index) => {
                    const isNewMain = (!hasMainInExisting && index === 0);
                    const slotNum = existingImages.length + index + 1;
                    const isDraggingThis = draggedNewIndex === index;
                    const isDropTarget = dragOverNewIndex === index;

                    return (
                        <div 
                            key={url} 
                            className={`gallery-item ${isNewMain ? 'is-main' : ''} ${isDraggingThis ? 'is-dragging' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
                            draggable={Boolean(onReorderNew)}
                            onDragStart={(e) => handleNewDragStart(e, index)}
                            onDragOver={(e) => handleNewDragOver(e, index)}
                            onDrop={(e) => handleNewDrop(e, index)}
                            onDragEnd={handleNewDragEnd}
                            title={onReorderNew ? "Drag to reorder photos" : undefined}
                            data-testid={`new-image-${index}`}
                        >
                            <img src={url} alt="New Upload" className="gallery-img" />

                            {isNewMain ? (
                                <div className="main-cover-badge">
                                    <StarIcon /> Main Cover (Unsaved)
                                </div>
                            ) : (
                                <div className="slot-badge">
                                    #{slotNum} • EXTERIOR (Unsaved)
                                </div>
                            )}

                            <div className="card-top-actions">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openCropModal('new', index, originalPreviews ? originalPreviews[index] : url); }}
                                    className="crop-btn"
                                    title="Crop / Rotate photo"
                                    aria-label="Crop photo"
                                >
                                    <CropIcon />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemoveNew(index); }}
                                    className="delete-btn"
                                    title="Remove photo"
                                    aria-label="Remove photo"
                                >
                                    <TrashIcon />
                                </button>
                            </div>

                            <div className="card-bottom-bar">
                                {!isNewMain && onSetMainNew && (
                                    <button
                                        type="button"
                                        className="set-main-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSetMainNew(index);
                                        }}
                                        title="Make this photo the main cover thumbnail"
                                        data-testid={`make-main-new-${index}`}
                                    >
                                        <StarIcon /> Make Main
                                    </button>
                                )}

                                <div className="reorder-arrows">
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onMoveNew) {
                                                    onMoveNew(index, 'left');
                                                } else if (onReorderNew) {
                                                    onReorderNew(index, index - 1);
                                                }
                                            }}
                                            title="Move earlier (to the left)"
                                            aria-label="Move photo left"
                                            data-testid={`move-left-new-${index}`}
                                        >
                                            <ChevronLeftIcon />
                                        </button>
                                    )}
                                    {index < newPreviews.length - 1 && (
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onMoveNew) {
                                                    onMoveNew(index, 'right');
                                                } else if (onReorderNew) {
                                                    onReorderNew(index, index + 1);
                                                }
                                            }}
                                            title="Move later (to the right)"
                                            aria-label="Move photo right"
                                            data-testid={`move-right-new-${index}`}
                                        >
                                            <ChevronRightIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
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
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>+ Add more photos</span>
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
                        <span style={styles.uploadSubtitle}>High-resolution JPG, PNG, or WebP up to 10MB.<br/>Landscape orientation (3:2 ratio) works best for auction cards and detail views.</span>
                    </div>
                </label>
            )}

            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                <span style={{ fontSize: '16px' }}>📸</span>
                <div>
                    <strong style={{ color: 'rgba(255,255,255,0.95)', display: 'block', marginBottom: '2px' }}>Tips for higher bids:</strong>
                    Shoot in natural daylight (early morning or golden hour). Be sure to include exterior 3/4 angles, profile views, wheels, odometer reading, clean interior dashboard, and engine bay.
                </div>
            </div>

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




const ResetIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>);
const RotateIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>);
const MinusIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>);

const CameraIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>);
const CropIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>);
const TrashIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const PlusIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const StarIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const ChevronLeftIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRightIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);
const GripIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="9" cy="19" r="1.5"></circle><circle cx="15" cy="5" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="15" cy="19" r="1.5"></circle></svg>);

