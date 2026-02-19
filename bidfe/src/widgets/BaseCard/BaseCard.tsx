import { Link } from "react-router-dom";
import type {ReactNode} from "react";
import styles from "./styles.ts";

interface BaseCardProps {
    to: string;
    imageUrl?: string | null;
    title: {
        year: number;
        make: string;
        model: string;
    };
    // Slots for overlays on top of the image
    overlays?: {
        topLeft?: ReactNode;
        topRight?: ReactNode; // <-- Added topRight slot
        bottomLeft?: ReactNode;
        bottomRight?: ReactNode;
    };
    // Content to render below the title
    children: ReactNode;
}

export const BaseCard = ({ to, imageUrl, title, overlays, children }: BaseCardProps) => {
    return (
        <Link to={to} style={styles.link}>
            <div style={styles.container}>

                {/* --- Shared Image Section --- */}
                <div style={styles.imageWrapper}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={`${title.year} ${title.make} ${title.model}`}
                            style={styles.image}
                            loading="lazy"
                        />
                    ) : (
                        <div style={styles.placeholder}>No Photos</div>
                    )}

                    {/* Render Overlays if they exist */}
                    {overlays?.topLeft && (
                        <div style={styles.overlayTopLeft}>{overlays.topLeft}</div>
                    )}

                    {/* --- Render New Top Right Overlay --- */}
                    {overlays?.topRight && (
                        <div style={styles.overlayTopRight}>{overlays.topRight}</div>
                    )}

                    {/* We wrap bottom overlays in a container to handle positioning */}
                    {(overlays?.bottomLeft || overlays?.bottomRight) && (
                        <div style={styles.overlayBottomContainer}>
                            <div>{overlays.bottomLeft}</div>
                            <div>{overlays.bottomRight}</div>
                        </div>
                    )}
                </div>

                {/* --- Shared Content Section --- */}
                <div style={styles.content}>
                    <h3 style={styles.title}>
                        <span style={styles.year}>{title.year}</span> {title.make} {title.model}
                    </h3>

                    {/* Specific card content goes here */}
                    {children}
                </div>
            </div>
        </Link>
    );
};