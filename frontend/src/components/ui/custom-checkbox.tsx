import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 ease-in-out
        ${checked 
          ? 'border-black bg-black' 
          : 'border-gray-300 bg-white hover:border-gray-400'
        }
        ${disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer'
        }
        ${className}
      `}
    >
      {checked && (
        <Check className="h-3 w-3 text-white" />
      )}
    </button>
  );
}; 