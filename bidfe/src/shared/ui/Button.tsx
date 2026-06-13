import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    children: ReactNode;
    fullWidth?: boolean;
}

export const Button = ({
    variant = "primary",
    size = "md",
    children,
    fullWidth = false,
    className = "",
    ...props
}: ButtonProps) => {
    let baseClass = "btn";
    
    if (variant === "primary") baseClass += " btn-primary";
    if (variant === "secondary") baseClass += " btn-secondary";
    if (variant === "danger") baseClass += " btn-danger"; 
    if (variant === "ghost") baseClass += " btn-ghost";   

    if (fullWidth) baseClass += " w-full";

    const style = fullWidth ? { width: "100%" } : {};

    return (
        <button className={`${baseClass} ${className}`} style={style} {...props}>
            {children}
        </button>
    );
};
