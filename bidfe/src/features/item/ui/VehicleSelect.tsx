import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VehicleSelectProps {
    name: string;
    value: string;
    options: string[];
    loading?: boolean;
    placeholder?: string;
    disabled?: boolean;
    hasError?: boolean;
    onChange: (e: { target: { name: string, value: string } }) => void;
}

export const VehicleSelect = ({ name, value, options, loading, placeholder, disabled, hasError, onChange }: VehicleSelectProps) => {
    const [searchQuery, setSearchQuery] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);

    const [prevValue, setPrevValue] = useState(value);

    // Sync external value changes
    if (value !== prevValue) {
        setPrevValue(value);
        setSearchQuery(value || '');
    }



    // Only show hints if there is text in the input
    const dynamicHints = searchQuery.trim().length > 0
        ? options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10)
        : [];

    const handleSelect = (option: string) => {
        setSearchQuery(option);
        onChange({ target: { name, value: option } });
        setIsFocused(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchQuery.trim().length > 0) {
                const exactMatch = options.find(opt => opt.toLowerCase() === searchQuery.trim().toLowerCase());
                handleSelect(exactMatch || searchQuery.trim());
            }
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (searchQuery.trim().length > 0) {
            const exactMatch = options.find(opt => opt.toLowerCase() === searchQuery.trim().toLowerCase());
            if (exactMatch && exactMatch !== searchQuery) {
                handleSelect(exactMatch);
            }
        } else {
            onChange({ target: { name, value: '' } });
        }
    };

    return (
        <div className="vehicle-select-container">
            <div className="vehicle-select-input-wrapper" style={{ position: 'relative' }}>
                {/* Foreground Input for Typing */}
                <input
                    type="text"
                    className={`modern-input standard-input vehicle-select-input-foreground ${hasError ? 'input-error' : ''}`}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        onChange({ target: { name, value: e.target.value } });
                    }}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    disabled={disabled}
                    placeholder={placeholder}
                    autoComplete="off"
                    style={{ 
                        position: 'relative',
                        paddingLeft: '16px', paddingRight: '44px',
                        zIndex: 2,
                    }}
                />
                
                <div className="vehicle-select-icon-right" style={{ zIndex: 3 }}>
                    {loading && <Loader2 size={20} className="spinner" />}
                </div>
            </div>

            {/* Dynamic Suggestions / Hints in Balloons/Pills */}
            {!disabled && isFocused && (dynamicHints.length > 0) && (
                <div className="vehicle-select-hints">
                    {dynamicHints.map(hint => (
                        <div 
                            key={hint} 
                            className="vehicle-select-hint-pill"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(hint);
                            }}
                        >
                            {hint}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
