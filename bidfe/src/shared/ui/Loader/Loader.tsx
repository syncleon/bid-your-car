import React from 'react';
import './Loader.css';

interface LoaderProps {
    size?: 'small' | 'medium' | 'large';
    label?: string;
    className?: string;
    fullPage?: boolean;
}

export const Loader = ({ size = 'medium', label, className = '', fullPage = false }: LoaderProps) => {
    const loaderContent = (
        <div className={`loader-container ${className}`}>
            <div className={`spinner spinner--${size}`} />
            {label && <span className="loader-label">{label}</span>}
        </div>
    );

    if (fullPage) {
        return <div className="loader-fullpage">{loaderContent}</div>;
    }

    return loaderContent;
};
