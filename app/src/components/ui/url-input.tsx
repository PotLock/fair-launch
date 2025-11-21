"use client"

import React, { useRef, useState } from 'react';

interface URLInputProps {
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isInvalid?: boolean;
}

export default function URLInput({
  prefix,
  value,
  onChange,
  placeholder = "",
  className = "",
  disabled = false,
  isInvalid = false
}: URLInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Remove prefix and https:// from value for display in input field
  let displayValue = value;
  if (prefix === 'x.com/' || prefix === 't.me/') {
    if (value.startsWith('https://x.com/')) {
      displayValue = value.slice('https://x.com/'.length);
    } else if (value.startsWith('https://t.me/')) {
      displayValue = value.slice('https://t.me/'.length);
    } else if (value.startsWith(prefix)) {
      displayValue = value.slice(prefix.length);
    }
  } else if (value.startsWith(prefix)) {
    displayValue = value.slice(prefix.length);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // For x.com/ and t.me/, prepend https://
    let fullValue = prefix + newValue;
    if (prefix === 'x.com/' || prefix === 't.me/') {
      fullValue = 'https://' + fullValue;
    }
    
    onChange(fullValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (inputRef.current) {
      // Set cursor position to the end of the current displayValue
      const position = displayValue.length;
      setTimeout(() => {
        inputRef.current?.setSelectionRange(position, position);
      }, 0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClick = () => {
    if (inputRef.current) {
      const currentCursorPos = inputRef.current.selectionStart || 0;
      // If cursor is not at the end, move it to the end of the displayValue
      if (currentCursorPos < displayValue.length) {
        const position = displayValue.length;
        setTimeout(() => {
          inputRef.current?.setSelectionRange(position, position);
        }, 0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    
    // Prevent backspace if cursor is at the very beginning of the editable part
    if (cursorPos === 0 && e.key === 'Backspace') {
      e.preventDefault();
    }
    // Prevent arrow left if cursor is at the very beginning of the editable part
    if (cursorPos === 0 && e.key === 'ArrowLeft') {
      e.preventDefault();
    }
  };

  return (
    <div className={`relative flex items-center border rounded-lg ${
      isInvalid && value ? 'border-red-500' : 'border-gray-300'
    } ${isFocused ? 'ring-2 ring-red-500' : ''} ${className}`}>
      {/* Prefix display */}
      <span className="pl-3 py-2 text-gray-500 select-none border-r border-gray-200 px-1 bg-gray-100/60 rounded-l-lg">
        {prefix}
      </span>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={displayValue} // Display only the user-editable part
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-grow pr-3 py-2 bg-transparent focus:outline-none text-sm sm:text-base px-1"
      />
    </div>
  );
}