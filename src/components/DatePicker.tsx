'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
}

export default function DatePicker({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'dd-mm-yyyy',
}: DatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Ensure portal only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate initial dropdown position - centered on mobile, near input on desktop
  useEffect(() => {
    if (isCalendarOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const calendarWidth = 288; // w-72 = 18rem = 288px
      const calendarHeight = 360;
      const isMobile = window.innerWidth < 640;
      
      if (isMobile) {
        // Center on screen for mobile
        setDropdownPosition({
          top: Math.max(20, (window.innerHeight - calendarHeight) / 2),
          left: Math.max(10, (window.innerWidth - calendarWidth) / 2),
        });
      } else {
        // Position near input for desktop
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < calendarHeight && rect.top > spaceBelow;
        
        setDropdownPosition({
          top: openUpward ? Math.max(10, rect.top - calendarHeight - 8) : rect.bottom + 8,
          left: Math.min(rect.left, window.innerWidth - calendarWidth - 10),
        });
      }
    }
  }, [isCalendarOpen]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({
      x: clientX - dropdownPosition.left,
      y: clientY - dropdownPosition.top,
    });
  }, [dropdownPosition]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const calendarWidth = 288;
      const calendarHeight = 360;
      
      // Keep calendar within viewport bounds
      const newLeft = Math.max(0, Math.min(clientX - dragOffset.x, window.innerWidth - calendarWidth));
      const newTop = Math.max(0, Math.min(clientY - dragOffset.y, window.innerHeight - calendarHeight));
      
      setDropdownPosition({
        top: newTop,
        left: newLeft,
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  // Sync input value with prop value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const formatted = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      setInputValue(formatted);
      setCurrentMonth(date);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const calendarEl = document.getElementById('datepicker-calendar');
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        (!calendarEl || !calendarEl.contains(target))
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseInputDate = (input: string): Date | null => {
    // Try dd-mm-yyyy format
    const ddmmyyyy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
    const match = input.match(ddmmyyyy);
    if (match) {
      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try yyyy-mm-dd format
    const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    const match2 = input.match(yyyymmdd);
    if (match2) {
      const [, year, month, day] = match2;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  };

  // Format date to YYYY-MM-DD using LOCAL timezone (not UTC)
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsed = parseInputDate(newValue);
    if (parsed) {
      onChange(formatDateToYYYYMMDD(parsed));
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInputDate(inputValue);
    if (parsed) {
      const formatted = `${String(parsed.getDate()).padStart(2, '0')}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${parsed.getFullYear()}`;
      setInputValue(formatted);
    } else if (inputValue && !value) {
      setInputValue('');
    }
  };

  const handleDateSelect = (date: Date) => {
    onChange(formatDateToYYYYMMDD(date));
    setIsCalendarOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onChange(formatDateToYYYYMMDD(today));
    setIsCalendarOpen(false);
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const selected = new Date(value);
    return (
      day === selected.getDate() &&
      currentMonth.getMonth() === selected.getMonth() &&
      currentMonth.getFullYear() === selected.getFullYear()
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm text-gray-400 mb-1">
          {label} {required && '*'}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsCalendarOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          required={required}
        />
        <button
          type="button"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-emerald-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Calendar Dropdown - Rendered via Portal */}
      {isCalendarOpen && isMounted && createPortal(
        <div 
          ref={calendarRef}
          id="datepicker-calendar"
          className="fixed z-[9999] w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            cursor: isDragging ? 'grabbing' : 'default',
          }}
        >
          {/* Draggable Handle */}
          <div 
            className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 cursor-grab active:cursor-grabbing touch-none select-none"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <span>Drag to move</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 border-b border-gray-700">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 p-2 bg-gray-800/30">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: startingDay }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-all touch-manipulation
                    ${isSelected(day)
                      ? 'bg-emerald-500 text-white font-semibold'
                      : isToday(day)
                      ? 'bg-gray-700 text-emerald-400 font-semibold ring-1 ring-emerald-500'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white active:bg-gray-600'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="p-2 border-t border-gray-700 bg-gray-800/30">
            <button
              type="button"
              onClick={goToToday}
              className="w-full py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors font-medium touch-manipulation"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
