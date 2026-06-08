import type { KeyboardEvent } from "react";

interface Option<T extends string | number | boolean> {
    label: string;
    value: T;
}

interface Props<T extends string | number | boolean> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    name?: string;
    fullWidth?: boolean;
}

export function SegmentedControl<T extends string | number | boolean>({
    options,
    value,
    onChange,
    name,
    fullWidth = true
}: Props<T>) {
    return (
        <div 
            className="segmented-control" 
            role="radiogroup" 
            aria-label={name}
            style={{
                display: "flex",
                background: "var(--bg-card-hover)",
                padding: "4px",
                borderRadius: "12px",
                gap: "4px",
                width: fullWidth ? "100%" : "max-content",
                border: "1px solid var(--border-color)",
            }}
        >
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <div
                        key={String(option.value)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(e: KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onChange(option.value);
                            }
                        }}
                        className={`segmented-option ${isSelected ? 'segmented-option-selected' : ''}`}
                    >
                        {option.label}
                    </div>
                );
            })}
        </div>
    );
}
