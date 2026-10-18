import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    maxWidth?: string | number;
    className?: string;
}

export const Modal = ({ isOpen, onClose, children, title, maxWidth, className = "" }: Props) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const customWidthStyle = maxWidth
        ? {
              maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
              width: `min(100%, ${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth})`,
          }
        : undefined;

    return createPortal(
        <div className="modal__overlay" onClick={onClose}>
            <div
                className={`modal__card ${className}`}
                style={customWidthStyle}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title || "Modal"}
            >
                <div className="modal__header">
                    <h3 className="modal__title">{title}</h3>
                    <button
                        className="modal__close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className="modal__body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};