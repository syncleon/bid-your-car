import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import styles from "./styles.ts";
import "./BaseCard.css";

interface BaseCardProps {
    to: string;
    imageUrl?: string | null;
    title: {
        year: number;
        make: string;
        model: string;
    };
    overlays?: {
        topLeft?: ReactNode;
        topRight?: ReactNode;
        bottomLeft?: ReactNode;
        bottomRight?: ReactNode;
    };
        children: ReactNode;
        isUrgent?: boolean;
        viewMode?: "grid" | "list";
}

export const BaseCard = ({ to, imageUrl, title, overlays, children, isUrgent, viewMode = "grid" }: BaseCardProps) => {
    const isList = viewMode === "list";
    return (
        <Link
            to={to}
            className={`base-card-link${isList ? " base-card-link--list" : ""}`}
        >
            <div
                className={`base-card${isUrgent ? " base-card--urgent" : ""}${isList ? " base-card--list" : ""}`}
                style={styles.container}
                data-urgent={isUrgent ? "true" : undefined}
            >
                <div
                    className={`base-card-image-wrapper${isList ? " base-card-image-wrapper--list" : ""}`}
                    style={styles.imageWrapper}
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={`${title.year} ${title.make} ${title.model}`}
                            className="base-card-image"
                            style={styles.image}
                            loading="lazy"
                        />
                    ) : (
                        <div style={styles.placeholder}>No Photos</div>
                    )}

                    {overlays?.topLeft && (
                        <div style={styles.overlayTopLeft}>{overlays.topLeft}</div>
                    )}
                    {overlays?.topRight && (
                        <div style={styles.overlayTopRight}>{overlays.topRight}</div>
                    )}
                    {(overlays?.bottomLeft || overlays?.bottomRight) && (
                        <div style={styles.overlayBottomContainer}>
                            <div>{overlays.bottomLeft}</div>
                            <div>{overlays.bottomRight}</div>
                        </div>
                    )}
                </div>

                <div style={isList ? { ...styles.content, flex: 1, padding: "12px 14px" } : styles.content}>
                    <div className="base-card-title-row">
                        <h3 style={styles.title}>
                            <span style={styles.year}>{title.year}</span> {title.make} {title.model}
                        </h3>
                    </div>
                    {children}
                </div>
            </div>
        </Link>
    );
};
