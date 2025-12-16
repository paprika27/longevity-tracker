
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Timer } from 'lucide-react';
import { DateFormat, TimeFormat } from '../types';

// UTILITY EXPORT
export const formatDuration = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
};

interface FormattedDateInputProps {
  value: string; // ISO YYYY-MM-DD
  onChange: (val: string) => void;
  format: DateFormat;
  className?: string;
}

export const FormattedDateInput: React.FC<FormattedDateInputProps> = ({ value, onChange, format, className }) => {
  const [textValue, setTextValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Helper: Format ISO to Display
  const formatDisplay = (iso: string, fmt: DateFormat): string => {
    if (!iso) return '';
    try {
        const [y, m, d] = iso.split('-');
        if (!y || !m || !d) return iso;
        if (fmt === 'DD.MM.YYYY') return `${d}.${m}.${y}`;
        if (fmt === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
        return iso; // YYYY-MM-DD
    } catch {
        return iso;
    }
  };

  // Helper: Parse Display to ISO
  const parseToIso = (display: string, fmt: DateFormat): string | null => {
    if (!display) return null;
    const clean = display.trim();
    
    try {
        let y, m, d;
        if (fmt === 'DD.MM.YYYY') {
            const parts = clean.split('.');
            if (parts.length !== 3) return null;
            [d, m, y] = parts;
        } else if (fmt === 'MM/DD/YYYY') {
            const parts = clean.split('/');
            if (parts.length !== 3) return null;
            [m, d, y] = parts;
        } else {
            // YYYY-MM-DD
            const parts = clean.split('-');
            if (parts.length !== 3) return null;
            [y, m, d] = parts;
        }

        // Pad
        m = m.padStart(2, '0');
        d = d.padStart(2, '0');
        
        // Basic validation
        const date = new Date(`${y}-${m}-${d}`);
        if (isNaN(date.getTime())) return null;
        
        return `${y}-${m}-${d}`;
    } catch {
        return null;
    }
  };

  // Sync prop to state when not focused
  useEffect(() => {
    if (!isFocused) {
        setTextValue(formatDisplay(value, format));
    }
  }, [value, format, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const iso = parseToIso(textValue, format);
    if (iso) {
        onChange(iso);
        setTextValue(formatDisplay(iso, format)); // normalize display
    } else {
        // revert to valid
        setTextValue(formatDisplay(value, format)); 
    }
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
  };

  // Handle Arrow Keys for Quick Adjustment
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIso = parseToIso(textValue, format) || value;
      if (!currentIso) return;

      const date = new Date(currentIso);
      if (isNaN(date.getTime())) return;

      // Add or Subtract 1 Day
      date.setDate(date.getDate() + (e.key === 'ArrowUp' ? 1 : -1));

      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const newIso = `${y}-${m}-${d}`;

      onChange(newIso);
      setTextValue(formatDisplay(newIso, format));
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={format.toLowerCase()}
        className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-white text-slate-900 font-medium z-10 relative bg-transparent"
      />
      
      {/* Native Date Picker Trigger */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-20">
          <div className="relative w-5 h-5 overflow-hidden hover:text-indigo-600 text-slate-400 transition-colors">
              <Calendar className="w-5 h-5 absolute pointer-events-none" />
              <input
                type="date"
                value={value}
                onChange={handleNativePickerChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                tabIndex={-1}
              />
          </div>
      </div>
    </div>
  );
};

interface FormattedTimeInputProps {
  value: string; // HH:MM
  onChange: (val: string) => void;
  format: TimeFormat;
  className?: string;
}

export const FormattedTimeInput: React.FC<FormattedTimeInputProps> = ({ value, onChange, format, className }) => {
    const [textValue, setTextValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Convert 24h (HH:MM) to 12h (hh:MM AA)
    const to12h = (time24: string) => {
        if (!time24) return '';
        const [hStr, mStr] = time24.split(':');
        let h = parseInt(hStr);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; 
        return `${h}:${mStr} ${ampm}`;
    };

    // Convert 12h to 24h
    const to24h = (time12: string) => {
        const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$/i);
        if (!match) return null;
        
        let h = parseInt(match[1]);
        const m = match[2];
        const ampm = match[3].toUpperCase();

        if (h > 12) return null;
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        return `${String(h).padStart(2, '0')}:${m}`;
    };

    useEffect(() => {
        if (!isFocused) {
            setTextValue(format === '12h' ? to12h(value) : value);
        }
    }, [value, format, isFocused]);

    const handleBlur = () => {
        setIsFocused(false);
        if (format === '24h') {
             // Validate simple HH:MM
             if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(textValue)) {
                 onChange(textValue);
             } else {
                 setTextValue(value);
             }
        } else {
            const iso = to24h(textValue);
            if (iso) {
                onChange(iso);
                setTextValue(to12h(iso));
            } else {
                setTextValue(to12h(value));
            }
        }
    };

    // Handle Arrow Keys for Quick Adjustment (Minutes)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          
          let current24 = format === '24h' ? textValue : to24h(textValue) || value;
          if (!current24) return;
          
          const [hStr, mStr] = current24.split(':');
          let h = parseInt(hStr);
          let m = parseInt(mStr);
          
          // Increment/Decrement by 1 minute (or 15 min if shift held)
          const step = e.shiftKey ? 15 : 1;
          const delta = e.key === 'ArrowUp' ? step : -step;
          
          let totalMinutes = h * 60 + m + delta;
          
          // Wrap around day
          if (totalMinutes < 0) totalMinutes += 1440;
          if (totalMinutes >= 1440) totalMinutes -= 1440;
          
          h = Math.floor(totalMinutes / 60);
          m = totalMinutes % 60;
          
          const new24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          
          onChange(new24);
          setTextValue(format === '12h' ? to12h(new24) : new24);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                placeholder={format === '12h' ? '12:00 PM' : '24:00'}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-white text-slate-900 font-medium z-10 relative bg-transparent"
            />
            
            {/* Native Time Picker Trigger */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-20">
                <div className="relative w-5 h-5 overflow-hidden hover:text-indigo-600 text-slate-400 transition-colors">
                    <Clock className="w-5 h-5 absolute pointer-events-none" />
                    <input
                        type="time"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        tabIndex={-1}
                    />
                </div>
            </div>
        </div>
    );
};

interface FormattedDurationInputProps {
    value: number | null;
    onChange: (val: number | null) => void;
    placeholder?: string;
    unit?: string;
}

export const FormattedDurationInput: React.FC<FormattedDurationInputProps> = ({ value, onChange, placeholder, unit }) => {
    const [textValue, setTextValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Convert decimal (6.5) to "6:30"
    const toTimeStr = (val: number | null) => {
        if (val === null || val === undefined || isNaN(val)) return '';
        return formatDuration(val);
    };

    // Convert "6:30" to decimal 6.5
    const toDecimal = (str: string) => {
        if (!str) return null;
        if (str.includes(':')) {
            const [h, m] = str.split(':').map(Number);
            if (isNaN(h)) return null;
            const min = isNaN(m) ? 0 : m;
            return parseFloat((h + min / 60).toFixed(2));
        }
        // Fallback: it's just a number like "6.5"
        const num = parseFloat(str);
        return isNaN(num) ? null : num;
    };

    useEffect(() => {
        if (!isFocused) {
            setTextValue(toTimeStr(value));
        }
    }, [value, isFocused]);

    const handleBlur = () => {
        setIsFocused(false);
        const decimal = toDecimal(textValue);
        onChange(decimal);
        setTextValue(toTimeStr(decimal));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const current = toDecimal(textValue) || value || 0;
            // Step by 15 minutes (0.25) by default
            const step = 0.25;
            const delta = e.key === 'ArrowUp' ? step : -step;
            const newVal = Math.max(0, parseFloat((current + delta).toFixed(2)));
            
            onChange(newVal);
            setTextValue(toTimeStr(newVal));
        }
    };

    return (
        <div className="relative">
             <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                placeholder={placeholder || "0:00"}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2.5 border bg-white text-slate-900 font-medium placeholder:font-normal placeholder:text-slate-400"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                {unit ? <span className="text-xs font-medium">{unit}</span> : <Timer className="w-4 h-4" />}
            </div>
        </div>
    );
};
