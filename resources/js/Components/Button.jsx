import React from 'react';

const Button = ({
    children,
    isLoading = false,
    variant = 'primary',
    size = 'md',
    icon: Icon = null,
    fullWidth = false,
    className = '',
    disabled = false,
    ...props
}) => {
    // Base styles for all buttons
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold transition-all rounded-xl shrink-0';

    // Different color variants definitions
    const variants = {
        primary: 'bg-gradient-to-r from-brand to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-brand/20 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
        danger: 'bg-red-100 text-red-600 hover:bg-red-200 disabled:bg-red-50 disabled:text-red-300',
        dangerSolid: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 disabled:bg-red-300 disabled:shadow-none',
        success: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-300',
        successSolid: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:bg-emerald-300 disabled:shadow-none',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
        brandGhost: 'bg-brand/10 text-brand hover:bg-brand/20 disabled:bg-brand/5 disabled:text-brand/50',
        unstyled: '', // Allows custom tailwind classes without overriding them
    };

    // Different size definitions
    const sizes = {
        xs: 'py-1 px-2 text-xs',
        sm: 'py-2 px-4 text-sm',
        md: 'py-2.5 px-5 text-sm',
        lg: 'py-3 px-6 text-base',
        xl: 'py-4 px-8 text-lg rounded-2xl',
        icon: 'p-2', // strictly for icon only buttons
    };

    // Icon size mapping relative to button size
    const iconSizes = {
        xs: 14,
        sm: 16,
        md: 18,
        lg: 20,
        xl: 22,
        icon: 18,
    };

    const isDisabled = disabled || isLoading;

    return (
        <button
            disabled={isDisabled}
            className={`
                ${variant !== 'unstyled' ? baseStyles : 'transition-all'}
                ${variants[variant] !== undefined ? variants[variant] : variants.primary}
                ${variant !== 'unstyled' ? (sizes[size] || sizes.md) : ''}
                ${fullWidth ? 'w-full' : ''}
                ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
            {...props}
        >
            {isLoading ? (
                <>
                    <span 
                        className={`border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0 ${variant === 'unstyled' && !Icon ? 'mr-2' : ''}`} 
                        style={{ width: iconSizes[size], height: iconSizes[size] }}
                    ></span>
                    {children}
                </>
            ) : (
                <>
                    {Icon && <Icon size={iconSizes[size]} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
