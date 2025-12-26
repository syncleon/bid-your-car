import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
                                           children,
                                           isLoading,
                                           disabled,
                                           variant = 'primary',
                                           className = '',
                                           ...props
                                       }) => {
    const baseStyles = 'font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline';
    const variants = {
        primary: 'bg-blue-500 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-500 hover:bg-gray-700 text-white'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
};

export default Button;