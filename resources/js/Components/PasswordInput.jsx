import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Button from './Button';


const PasswordInput = ({
    className,
    value,
    onChange,
    error,
    placeholder = "••••••••",
    disabled = false,
    required = true,
    showStrength = false
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Calculate password strength
    const getStrength = () => {
        if (!value) return { score: 0, label: '', color: '' };

        let score = 0;
        if (value.length >= 6) score++;
        if (value.length >= 8) score++;
        if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[^a-zA-Z0-9]/.test(value)) score++;

        if (score <= 2) return { score, label: 'ضعيفة', color: 'text-red-500' };
        if (score <= 4) return { score, label: 'متوسطة', color: 'text-yellow-500' };
        return { score, label: 'قوية', color: 'text-green-500' };
    };

    const strength = showStrength ? getStrength() : null;

    return (
        <div className="space-y-2">
            <div className="relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    required={required}
                    className={`${className} w-full px-6 py-4 pr-12 bg-slate-50 border-2 rounded-xl outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${error
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-transparent focus:border-brand'
                        }`}
                />

                {/* Toggle Password Visibility Button */}
                <Button variant="unstyled"
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff size={20} className="text-slate-500" />
                    ) : (
                        <Eye size={20} className="text-slate-400" />
                    )}
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

            {/* Password Strength Indicator */}
            {showStrength && strength && (
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all ${level <= strength.score
                                        ? strength.score <= 2
                                            ? 'bg-red-500'
                                            : strength.score <= 4
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                        : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className={`text-xs font-medium ${strength.color}`}>
                        {strength.label}
                    </span>
                </div>
            )}
        </div>
    );
};

export default PasswordInput;
