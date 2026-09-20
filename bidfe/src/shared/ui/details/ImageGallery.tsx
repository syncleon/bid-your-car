import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ItemDto } from "../../../features/item/types";
import { styles } from "./sharedStyles";

interface GalleryProps {
    item: ItemDto;
    statusLabel?: React.ReactNode;
}


const XIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ChevronLeftIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRightIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);

export const ImageGallery = ({ item, statusLabel }: GalleryProps) => {
    const images = item.images || [];
    const [activeIndex, setActiveIndex] = useState(() => {
        const mainIdx = images.findIndex(img => img.category === "MAIN");
        return mainIdx !== -1 ? mainIdx : 0;
    });
    
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = (idx: number, mode: 'single' | 'grid' = 'grid') => {
        setLightboxIndex(idx);
        setViewMode(mode);
        setLightboxOpen(true);
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        document.body.style.overflow = "auto";
    };

    const nextImage = useCallback(() => {
        setLightboxIndex(prev => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") nextImage();
            if (e.key === "ArrowLeft") prevImage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxOpen, nextImage, prevImage]);

    if (images.length === 0) {
        return <div style={styles.placeholder}>No Photos Available</div>;
    }

    const currentImage = images[activeIndex]?.url;

    return (
        <div style={styles.galleryContainer}>
            {/* Main Image */}
            <div style={styles.mainWrapper}>
                <img 
                    src={currentImage}
                    onClick={() => openLightbox(activeIndex, 'grid')}
                    style={{...styles.mainImg, cursor: "pointer" } as any} 
                    alt={item.model} 
                    
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://placehold.co/600x400/eeeeee/999999?text=Image+Not+Found"; }} 
                />
                {statusLabel && <div style={styles.statusOverlay}>{statusLabel}</div>}
            </div>

            {/* Thumbnails Grid (Right) */}
            {images.length > 1 && (
                <div style={styles.thumbGrid}>
                    {images.slice(0, 8).map((img, idx) => (
                        <div 
                            key={img.id || idx}
                            onClick={() => { setActiveIndex(idx); if (idx === 7 && images.length > 8) openLightbox(0, 'grid'); else openLightbox(idx, 'grid'); }}
                            style={{
                                ...styles.thumbWrapper,
                                border: idx === activeIndex ? "2px solid var(--text-primary)" : "none", 
                                opacity: idx === activeIndex ? 1 : 0.8
                            }}
                        >
                            <img 
                                src={img.url} 
                                alt={`thumb-${idx}`} 
                                style={styles.thumbImg}
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://placehold.co/150x150/eeeeee/999999?text=X"; }}
                            />
                            {idx === 7 && images.length > 8 && (
                                <div style={styles.moreOverlay}>
                                    All Photos ({images.length})
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        
            {lightboxOpen && createPortal(
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", zIndex: 99999, display: "flex", flexDirection: "column" }}>
                    
                    {/* Top Bar */}
                    <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", backgroundColor: "#000", borderBottom: "1px solid rgba(255,255,255,0.08)", zIndex: 10 }}>
                        
                        {/* Left: Title & Counter */}
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>Photos ({images.length})</span>
                            {viewMode === 'single' && (
                                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 500, background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "100px" }}>
                                    {lightboxIndex + 1} / {images.length}
                                </span>
                            )}
                        </div>

                        {/* Center: View Toggle */}
                        <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", padding: "4px", borderRadius: "100px", gap: "4px" }}>
                            <button 
                                type="button" 
                                onClick={() => setViewMode('grid')}
                                style={{ 
                                    background: viewMode === 'grid' ? "rgba(255,255,255,0.15)" : "transparent",
                                    border: "none", color: viewMode === 'grid' ? "white" : "rgba(255,255,255,0.6)", 
                                    padding: "6px 16px", borderRadius: "100px", cursor: "pointer", fontSize: "13px", fontWeight: 600, 
                                    display: "flex", gap: "6px", alignItems: "center", transition: "all 0.2s" 
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                Grid
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setViewMode('single')}
                                style={{ 
                                    background: viewMode === 'single' ? "rgba(255,255,255,0.15)" : "transparent",
                                    border: "none", color: viewMode === 'single' ? "white" : "rgba(255,255,255,0.6)", 
                                    padding: "6px 16px", borderRadius: "100px", cursor: "pointer", fontSize: "13px", fontWeight: 600, 
                                    display: "flex", gap: "6px", alignItems: "center", transition: "all 0.2s" 
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                Single
                            </button>
                        </div>

                        {/* Right: Close */}
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button type="button" onClick={closeLightbox} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"} onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
                                <XIcon />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'grid' ? (
                        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", alignContent: "start", background: "#0a0a0a" }}>
                            {images.map((img, idx) => (
                                <div 
                                    key={img.id || idx} 
                                    onClick={() => { setLightboxIndex(idx); setViewMode('single'); }}
                                    style={{ width: "100%", aspectRatio: "3/2", borderRadius: "8px", overflow: "hidden", cursor: "pointer", backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.05)", transition: "transform 0.2s, border-color 0.2s" }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                                >
                                    <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Main Viewport */}
                            <div onClick={() => nextImage()} style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", background: "#0a0a0a" }}>
                                <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, backdropFilter: "blur(12px)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.8)"} onMouseOut={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}>
                                    <ChevronLeftIcon />
                                </button>
                                
                                <img 
                                    src={images[lightboxIndex]?.url} 
                                    alt="Lightbox" 
                                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", cursor: "pointer", zIndex: 5, position: "relative" }} 
                                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                />
                                
                                <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ position: "absolute", right: "24px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, backdropFilter: "blur(12px)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.8)"} onMouseOut={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}>
                                    <ChevronRightIcon />
                                </button>
                            </div>

                            {/* Thumbnails Row */}
                            <div style={{ height: "100px", padding: "16px", display: "flex", gap: "8px", overflowX: "auto", backgroundColor: "#000", borderTop: "1px solid rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ display: "flex", gap: "10px", maxWidth: "100%", overflowX: "auto", padding: "0 16px" }}>
                                    {images.map((img, idx) => (
                                        <img 
                                            key={img.id || idx}
                                            src={img.url}
                                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                                            style={{ 
                                                height: "64px", 
                                                width: "96px", 
                                                objectFit: "cover", 
                                                borderRadius: "6px", 
                                                cursor: "pointer", 
                                                border: idx === lightboxIndex ? "2px solid white" : "2px solid transparent",
                                                opacity: idx === lightboxIndex ? 1 : 0.4,
                                                transition: "all 0.2s",
                                                transform: idx === lightboxIndex ? "scale(1.05)" : "scale(1)"
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            , document.body)}
        </div>
    );
};
