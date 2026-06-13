import { useState, useEffect, useRef, useId, type ChangeEvent, type KeyboardEvent } from "react";
import "./Autocomplete.css";

interface Props {
    value: string;
    options: string[];
    onChange: (val: string) => void;
    placeholder?: string;
    name?: string;
        allowCustom?: boolean;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <strong style={{ color: "#fff", fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</strong>
            {text.slice(idx + query.length)}
        </>
    );
}

export function Autocomplete({
    value,
    options,
    onChange,
    placeholder = "Select…",
    name,
    allowCustom = true,
    label,
    required,
    disabled,
}: Props) {
    const id = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    
    useEffect(() => { setInputValue(value); }, [value]);

    
    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                if (!allowCustom) setInputValue(value); 
            }
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [allowCustom, value]);

    
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const el = listRef.current.children[highlightedIndex] as HTMLElement;
            el?.scrollIntoView({ block: "nearest" });
        }
    }, [highlightedIndex]);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setInputValue(v);
        setHighlightedIndex(-1);
        setIsOpen(true);
        if (allowCustom) onChange(v);
    };

    const handleSelect = (option: string) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setInputValue("");
        onChange("");
        setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setIsOpen(true); }
            return;
        }
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex(p => Math.min(p + 1, filteredOptions.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex(p => Math.max(p - 1, -1));
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0) handleSelect(filteredOptions[highlightedIndex]);
                else if (allowCustom) setIsOpen(false);
                break;
            case "Escape":
                setIsOpen(false);
                if (!allowCustom) setInputValue(value);
                break;
            case "Tab":
                if (highlightedIndex >= 0) { e.preventDefault(); handleSelect(filteredOptions[highlightedIndex]); }
                else setIsOpen(false);
                break;
        }
    };

    
    const displayValue = (!allowCustom && isOpen && highlightedIndex >= 0)
        ? filteredOptions[highlightedIndex]
        : inputValue;

    const showDropdown = isOpen && filteredOptions.length > 0;
    const showEmpty   = isOpen && filteredOptions.length === 0 && inputValue.length > 0;

    return (
        <div ref={wrapperRef} className={`ac-wrapper${disabled ? " ac-disabled" : ""}`}>
            {label && <label htmlFor={id} className="ac-label">{label}{required && <span className="ac-required"> *</span>}</label>}

            <div className={`ac-input-wrap${isOpen ? " ac-input-wrap--open" : ""}`}>
                <input
                    id={id}
                    type="text"
                    name={name}
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={disabled}
                    required={required}
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    className="ac-input modern-input"
                />

                {}
                {inputValue && !disabled && (
                    <button type="button" className="ac-clear" onClick={handleClear} aria-label="Clear" tabIndex={-1}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                )}

                {}
                {!allowCustom && (
                    <span className={`ac-chevron${isOpen ? " ac-chevron--open" : ""}`} aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </span>
                )}
            </div>

            {}
            {showDropdown && (
                <ul ref={listRef} className="ac-menu" role="listbox">
                    {filteredOptions.map((option, index) => (
                        <li
                            key={option}
                            role="option"
                            aria-selected={highlightedIndex === index}
                            className={`ac-option${highlightedIndex === index ? " ac-option--active" : ""}`}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <HighlightMatch text={option} query={allowCustom ? inputValue : ""} />
                        </li>
                    ))}
                </ul>
            )}

            {showEmpty && (
                <div className="ac-empty">No matches for &ldquo;{inputValue}&rdquo;</div>
            )}
        </div>
    );
}
