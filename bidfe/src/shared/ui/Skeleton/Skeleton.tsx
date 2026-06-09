import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton = ({
    width,
    height,
    borderRadius,
    className = '',
    style = {},
    variant = 'rounded'
}: SkeletonProps) => {
    let defaultBorderRadius = '4px';
    if (variant === 'circular') defaultBorderRadius = '50%';
    if (variant === 'rectangular') defaultBorderRadius = '0px';
    if (variant === 'rounded') defaultBorderRadius = '8px';

    const mergedStyle: React.CSSProperties = {
        width: width || '100%',
        height: height || '100%',
        borderRadius: borderRadius || defaultBorderRadius,
        ...style
    };

    return <div className={`skeleton ${variant} ${className}`} style={mergedStyle} />;
};
