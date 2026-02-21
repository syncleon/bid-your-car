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
    overlays?: {
        topLeft?: ReactNode;
        topRight?: ReactNode;
        bottomLeft?: ReactNode;
        bottomRight?: ReactNode;
    };
    children: ReactNode;
}

export const BaseCard = ({ to, imageUrl, title, overlays, children }: BaseCardProps) => {
    return (
        <Link to={to} style={styles.link}>
            <div style={styles.container}>
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
                <div style={styles.content}>
                    <h3 style={styles.title}>
                        <span style={styles.year}>{title.year}</span> {title.make} {title.model}
                    </h3>
                    {children}
                </div>
            </div>
        </Link>
    );
};