import React from 'react';
import { ChevronDown } from 'lucide-react';

// Country codes data
const countryCodes = [
    { code: 'SY', name: 'سوريا', dialCode: '+963', flag: '🇸🇾' },
    { code: 'SA', name: 'السعودية', dialCode: '+966', flag: '🇸🇦' },
    { code: 'AE', name: 'الإمارات', dialCode: '+971', flag: '🇦🇪' },
    { code: 'KW', name: 'الكويت', dialCode: '+965', flag: '🇰🇼' },
    { code: 'QA', name: 'قطر', dialCode: '+974', flag: '🇶🇦' },
    { code: 'BH', name: 'البحرين', dialCode: '+973', flag: '🇧🇭' },
    { code: 'OM', name: 'عمان', dialCode: '+968', flag: '🇴🇲' },
    { code: 'JO', name: 'الأردن', dialCode: '+962', flag: '🇯🇴' },
    { code: 'LB', name: 'لبنان', dialCode: '+961', flag: '🇱🇧' },
    { code: 'IQ', name: 'العراق', dialCode: '+963', flag: '🇮🇶' },
    { code: 'EG', name: 'مصر', dialCode: '+20', flag: '🇪🇬' },
    { code: 'MA', name: 'المغرب', dialCode: '+212', flag: '🇲🇦' },
    { code: 'DZ', name: 'الجزائر', dialCode: '+213', flag: '🇩🇿' },
    { code: 'TN', name: 'تونس', dialCode: '+216', flag: '🇹🇳' },
    { code: 'LY', name: 'ليبيا', dialCode: '+218', flag: '🇱🇾' },
    { code: 'SD', name: 'السودان', dialCode: '+249', flag: '🇸🇩' },
    { code: 'YE', name: 'اليمن', dialCode: '+967', flag: '🇾🇪' },
    { code: 'TR', name: 'تركيا', dialCode: '+90', flag: '🇹🇷' },
    { code: 'IR', name: 'إيران', dialCode: '+98', flag: '🇮🇷' },
    { code: 'US', name: 'الولايات المتحدة', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'المملكة المتحدة', dialCode: '+44', flag: '🇬🇧' },
    { code: 'FR', name: 'فرنسا', dialCode: '+33', flag: '🇫🇷' },
    { code: 'DE', name: 'ألمانيا', dialCode: '+49', flag: '🇩🇪' },
];

const CountryCodeSelect = ({ value, onChange, disabled = false, className }) => {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`${className} appearance-none w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm`}
                dir="ltr"
            >
                {countryCodes.map((country) => (
                    <option key={country.code} value={country.dialCode}>
                        {country.flag} {country.dialCode}
                    </option>
                ))}
            </select>
            <ChevronDown
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
        </div>
    );
};

export const getCountryByDialCode = (dialCode) => {
    return countryCodes.find(c => c.dialCode === dialCode) || countryCodes[0];
};

export const getAllCountryCodes = () => countryCodes;

export default CountryCodeSelect;
