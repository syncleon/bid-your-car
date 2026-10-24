import type { CSSProperties, ReactNode } from "react";

interface CardPricePillProps {
    priceLabel?: string;
    priceValue?: string;
    rightContent?: ReactNode;
    border?: string;
    progressPercent?: number;
    progressBg?: string;
    style?: CSSProperties;
    children?: ReactNode;
}

export const CardPricePill = ({
    priceLabel,
    priceValue,
    rightContent,
    border = "1px solid rgba(255, 255, 255, 0.1)",
    progressPercent,
    progressBg,
    style,
    children,
}: CardPricePillProps) => {
    return (
        <div
            className="card-price-pill"
            style={{
                background: "rgba(17, 17, 17, 0.75)",
                backdropFilter: "blur(4px)",
                padding: "4px 8px 5px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                border,
                ...style,
            }}
        >
            {children ? (
                children
            ) : (
                <>
                    {(priceLabel || priceValue) && (
                        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                            {priceLabel && (
                                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", fontWeight: 500 }}>
                                    {priceLabel}
                                </span>
                            )}
                            {priceValue && (
                                <span style={{ fontSize: "13.5px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                    {priceValue}
                                </span>
                            )}
                        </div>
                    )}
                    {(priceLabel || priceValue) && rightContent && (
                        <div style={{ width: "1px", height: "12px", background: "rgba(255, 255, 255, 0.2)" }} />
                    )}
                    {rightContent}
                </>
            )}

            {progressPercent !== undefined && progressBg && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderBottomLeftRadius: "6px",
                        borderBottomRightRadius: "6px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${progressPercent}%`,
                            background: progressBg,
                            borderBottomLeftRadius: "6px",
                            transition: "width 1s linear",
                        }}
                    />
                </div>
            )}
        </div>
    );
};
