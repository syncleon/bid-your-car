import React from "react";
import type { ItemDto } from "../../../features/item/types";
import { styles } from "./sharedStyles";

interface GalleryProps {
    item: ItemDto;
    statusLabel?: React.ReactNode;
}

export const ImageGallery = ({ item, statusLabel }: GalleryProps) => {
    const images = item.images || [];
    const [activeIndex, setActiveIndex] = React.useState(() => {
        const mainIdx = images.findIndex(img => img.category === "MAIN");
        return mainIdx !== -1 ? mainIdx : 0;
    });

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
                    alt={item.model} 
                    style={styles.mainImg}
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
                            onClick={() => setActiveIndex(idx)}
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
        </div>
    );
};
