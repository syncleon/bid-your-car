import React, { useState, useEffect, useRef } from 'react';
import { AppDialog } from './AppDialog';

interface PromptDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isPassword?: boolean;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
    isOpen,
    title,
    message,
    placeholder = "",
    onConfirm,
    onCancel,
    confirmLabel = "Submit",
    cancelLabel = "Cancel",
    isPassword = false
}) => {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue("");
            // slight delay to ensure dialog is rendered
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <AppDialog isOpen={isOpen} onClose={onCancel}>
            <div onClick={(e) => e.stopPropagation()}>
                <h3 className="dialog-title">{title}</h3>
                <p className="dialog-message">{message}</p>
                <input
                    ref={inputRef}
                    type={isPassword ? "password" : "text"}
                    className="dialog-input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    onKeyDown={handleKeyDown}
                />
                <div className="dialog-actions">
                    <button className="dialog-btn dialog-btn-cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className="dialog-btn dialog-btn-confirm"
                        onClick={handleConfirm}
                        disabled={!value.trim()}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </AppDialog>
    );
};
