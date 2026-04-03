import React, { useState, useEffect } from 'react';
import CountryCodeSelect, { getCountryByDialCode } from './CountryCodeSelect';
import { Phone, CheckCircle, XCircle } from 'lucide-react';

const PhoneInput = ({
    className,
    value,
    onChange,
    error,
    placeholder = "9XX XXX XXX",
    defaultCountry = 'SY',
    disabled = false,
    showValidation = true,
    required = true
}) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [countryCode, setCountryCode] = useState(defaultCountry);
    const [isValid, setIsValid] = useState(false);
    const [touched, setTouched] = useState(false);

    // Get country data
    const country = getCountryByDialCode(countryCode);

    // Validate phone number
    const validatePhone = (phone) => {
        // Remove spaces and dashes
        const cleaned = phone.replace(/[\s-]/g, '');

        // Check if it's only numbers
        if (!/^\d+$/.test(cleaned)) {
            return false;
        }

        // Check length (typically 7-15 digits for international numbers)
        if (cleaned.length < 7 || cleaned.length > 15) {
            return false;
        }

        return true;
    };

    // Handle value change
    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        setTouched(true);

        const isValidPhone = validatePhone(newValue);
        setIsValid(isValidPhone);

        // Format full phone number with country code
        const fullNumber = `${countryCode}${newValue.replace(/[\s-]/g, '')}`;

        if (onChange) {
            onChange({
                value: newValue,
                fullNumber: isValidPhone ? fullNumber : null,
                countryCode: countryCode,
                isValid: isValidPhone
            });
        }
    };

    // Handle country code change
    const handleCountryChange = (newCode) => {
        setCountryCode(newCode);
        setTouched(true);

        const isValidPhone = validatePhone(localValue);
        setIsValid(isValidPhone);

        if (onChange) {
            const fullNumber = isValidPhone ? `${newCode}${localValue.replace(/[\s-]/g, '')}` : null;
            onChange({
                value: localValue,
                fullNumber: fullNumber,
                countryCode: newCode,
                isValid: isValidPhone
            });
        }
    };

    // Update local value when prop changes
    useEffect(() => {
        if (value !== undefined && value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                {/* Country Code Select */}
                <div className="w-28 flex-shrink-0">
                    <CountryCodeSelect
                        className={className}
                        value={countryCode}
                        onChange={handleCountryChange}
                        disabled={disabled}
                    />
                </div>

                {/* Phone Input */}
                <div className="relative flex-1">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone size={18} />
                    </div>
                    <input
                        type="tel"
                        value={localValue}
                        onChange={handleChange}
                        onBlur={() => setTouched(true)}
                        disabled={disabled}
                        placeholder={placeholder}
                        required={required}
                        className={`${className} w-full pr-12 pl-4 py-3 bg-slate-50 border-2 rounded-xl outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${error
                            ? 'border-red-500 focus:border-red-500'
                            : isValid && touched
                                ? 'border-green-500 focus:border-green-500'
                                : 'border-transparent focus:border-brand'
                            }`}
                        dir="ltr"
                    />

                    {/* Validation Icon */}
                    {showValidation && touched && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            {isValid ? (
                                <CheckCircle size={18} className="text-green-500" />
                            ) : localValue.length > 0 ? (
                                <XCircle size={18} className="text-red-500" />
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

            {/* Helper Text */}
            {!error && showValidation && (
                <p className={`text-xs font-medium ${isValid && touched ? 'text-green-500' : 'text-slate-400'
                    }`}>
                    {country?.name} — رمز الاتصال: {country?.dialCode}
                </p>
            )}
        </div>
    );
};

export default PhoneInput;
