import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: "default" | "ghost";
    padding?: string;
}

export const Card = ({ children, variant = "default", padding = "32px", style, className = "", ...props }: CardProps) => {
    return (
        <div 
            className={`${variant === "ghost" ? "ghost-panel" : ""} ${className}`}
            style={{
                background: variant === "ghost" ? undefined : "var(--bg-card)",
                borderRadius: "24px",
                padding,
                border: variant === "ghost" ? undefined : "1px solid var(--border-color)",
                boxShadow: variant === "ghost" ? undefined : "var(--shadow-md)",
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
};
