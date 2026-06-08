import React from 'react';
import { AppDialog } from './AppDialog';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isDestructive = false
}) => {
    return (
        <AppDialog isOpen={isOpen} onClose={onCancel}>
            <div onClick={(e) => e.stopPropagation()}>
                <h3 className="dialog-title">{title}</h3>
                <p className="dialog-message">{message}</p>
                <div className="dialog-actions">
                    <button className="dialog-btn dialog-btn-cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`dialog-btn ${isDestructive ? 'dialog-btn-destructive' : 'dialog-btn-confirm'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </AppDialog>
    );
};
