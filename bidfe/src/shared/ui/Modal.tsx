import type { ReactNode } from "react";
import { useEffect } from "react";
import "./Modal.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string; // Optional title for the modal header
}

export const Modal = ({ isOpen, onClose, children, title }: Props) => {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal__overlay" onClick={onClose}>
            <div className="modal__content" onClick={(e) => e.stopPropagation()}>
                {/* Close Button (X) */}
                <button
                    className="modal__close-btn"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Optional Title matching FormSection style */}
                {title && (
                    <div style={{ padding: "24px 32px 0", marginBottom: "-10px" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", margin: 0 }}>
                            {title}
                        </h2>
                    </div>
                )}

                <div style={{ padding: "32px" }}>
                    {children}
                </div>
            </div>
        </div>
    );
};