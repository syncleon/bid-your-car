import React, { useEffect, useRef } from 'react';
import './AppDialog.css';

interface AppDialogProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const AppDialog: React.FC<AppDialogProps> = ({ isOpen, onClose, children }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else {
            if (dialog.open) {
                dialog.close();
            }
        }
    }, [isOpen]);

    // Close on backdrop click
    const handleLightDismiss = (e: React.MouseEvent<HTMLDialogElement>) => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
            && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            onClose();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className="app-dialog"
            onClick={handleLightDismiss}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            {children}
        </dialog>
    );
};
