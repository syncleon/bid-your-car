import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Car } from "lucide-react";
import styles from "./styles.ts";
import "./BaseCard.css";

export { CardBadge } from "./CardBadge";
export { CardPricePill } from "./CardPricePill";
export { CardSpecsGrid } from "./CardSpecsGrid";

interface BaseCardProps {
    to?: string;
    imageUrl?: string | null;
    title: {
        year: number | string;
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
    headerContent?: ReactNode;
    isUrgent?: boolean;
    viewMode?: "grid" | "list";
}

export const BaseCard = ({ to, imageUrl, title, overlays, children, headerContent, isUrgent, viewMode = "grid" }: BaseCardProps) => {
    const isList = viewMode === "list";

    const cardContent = (
        <div
            className={`base-card${isUrgent ? " base-card--urgent" : ""}${isList ? " base-card--list" : ""}`}
            style={styles.container}
            data-urgent={isUrgent ? "true" : undefined}
        >
                {headerContent}
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
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    const fallback = parent.querySelector('.base-card-fallback');
                                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                }
                            }}
                        />
                    ) : null}

                    <div
                        className="base-card-fallback"
                        style={{
                            ...styles.placeholder,
                            display: imageUrl ? "none" : "flex",
                        }}
                    >
                        <Car size={36} strokeWidth={1.5} style={{ opacity: 0.35 }} />
                        <span>No Photo</span>
                    </div>

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
                            {`${title.year} ${title.make} ${title.model}`}
                        </h3>
                    </div>
                    {children}
                </div>
            </div>
    );

    if (to) {
        return (
            <Link
                to={to}
                className={`base-card-link${isList ? " base-card-link--list" : ""}`}
            >
                {cardContent}
            </Link>
        );
    }

    return (
        <div className={`base-card-link${isList ? " base-card-link--list" : ""}`}>
            {cardContent}
        </div>
    );
};
