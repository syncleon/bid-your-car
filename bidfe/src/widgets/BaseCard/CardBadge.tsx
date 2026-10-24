import type { CSSProperties, ReactNode } from "react";

interface CardBadgeProps {
    children: ReactNode;
    dotColor?: string;
    style?: CSSProperties;
    className?: string;
}

export const CardBadge = ({ children, dotColor, style, className }: CardBadgeProps) => {
    return (
        <div
            className={`card-badge ${className || ""}`}
            style={{
                background: "rgba(0, 0, 0, 0.8)",
                color: "#ffffff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.5px",
                backdropFilter: "blur(4px)",
                ...style,
            }}
        >
            {dotColor && (
                <span
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: dotColor,
                        display: "block",
                        flexShrink: 0,
                        transition: "background-color 0.3s ease",
                    }}
                />
            )}
            {children}
        </div>
    );
};
