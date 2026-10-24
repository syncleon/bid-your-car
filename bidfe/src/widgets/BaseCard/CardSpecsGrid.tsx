import type { CSSProperties } from "react";

export const GaugeIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <path d="m12 14 4-4" />
        <path d="M3.34 16A10 10 0 1 1 20.66 16" />
    </svg>
);

export const CogIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export const GasPumpIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <path d="M3 22v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8" />
        <path d="M3 10V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
        <line x1="7" y1="12" x2="7" y2="12" />
        <path d="M11 22v-3a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1" />
        <path d="M21 22V10a2 2 0 0 0-2-2h-2" />
        <line x1="3" y1="22" x2="11" y2="22"></line>
    </svg>
);

export const MapPinIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

export const CheckCircleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

interface CardSpecsGridProps {
    mileage?: number | string | null;
    transmission?: string | null;
    engineOrFuel?: string | null;
    location?: string | null;
    mileageUnit?: string;
    style?: CSSProperties;
}

export const CardSpecsGrid = ({
    mileage,
    transmission,
    engineOrFuel,
    location,
    mileageUnit = "mi",
    style,
}: CardSpecsGridProps) => {
    let formattedMileage: string | null = null;
    if (mileage !== undefined && mileage !== null && mileage !== "") {
        if (typeof mileage === "number") {
            formattedMileage = `${mileage.toLocaleString()} ${mileageUnit}`;
        } else {
            const num = Number(mileage);
            formattedMileage = !isNaN(num) ? `${num.toLocaleString()} ${mileageUnit}` : `${mileage} ${mileageUnit}`;
        }
    }

    return (
        <div
            className="card-specs-grid"
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "4px 8px",
                marginTop: "6px",
                marginBottom: "2px",
                ...style,
            }}
        >
            {formattedMileage && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        lineHeight: 1.2,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        overflow: "hidden",
                    }}
                >
                    <GaugeIcon />
                    <span
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {formattedMileage}
                    </span>
                </div>
            )}
            {transmission && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        lineHeight: 1.2,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        overflow: "hidden",
                    }}
                >
                    <CogIcon />
                    <span
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {transmission}
                    </span>
                </div>
            )}
            {engineOrFuel && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        lineHeight: 1.2,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        overflow: "hidden",
                    }}
                    title={engineOrFuel}
                >
                    <GasPumpIcon />
                    <span
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {engineOrFuel}
                    </span>
                </div>
            )}
            {location && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        lineHeight: 1.2,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        overflow: "hidden",
                    }}
                    title={location}
                >
                    <MapPinIcon />
                    <span
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {location}
                    </span>
                </div>
            )}
        </div>
    );
};
