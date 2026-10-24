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
                padding: "3px 6px",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                letterSpacing: "0.4px",
                backdropFilter: "blur(4px)",
                ...style,
            }}
        >
            {dotColor && (
                <span
                    style={{
                        width: "5px",
                        height: "5px",
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
