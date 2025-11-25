import * as React from 'react';
import {cn} from '@/lib/utils';
import {ChevronDown, Check} from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, children, value, onChange, disabled, placeholder = 'Select an option...', ...props }, _ref) => {
    const [open, setOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const displayValue = React.useMemo(() => {
      const currentValue = value ?? internalValue;
      if (!currentValue) return placeholder;

      // Extract label from children
      const options = React.Children.toArray(children);
      const selectedOption = options.find((child) => {
        if (React.isValidElement<SelectOptionProps>(child) && child.type === SelectOption) {
          return child.props.value === currentValue;
        }
        return false;
      });

      if (React.isValidElement<SelectOptionProps>(selectedOption)) {
        return selectedOption.props.children;
      }

      return currentValue;
    }, [value, internalValue, children, placeholder]);

    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open]);

    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onChange?.(newValue);
      setOpen(false);
    };

    return (
      <SelectContext.Provider value={{ value: value ?? internalValue, onChange: handleChange, open, setOpen }}>
        <div ref={containerRef} className="relative">
          <button
            ref={buttonRef}
            type="button"
            className={cn(
              'w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground',
              'flex items-center justify-between',
              'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !internalValue && !value && 'text-muted-foreground',
              className
            )}
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
            {...props}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'transform rotate-180')} />
          </button>

          {open && (
            <div
              className="absolute z-50 w-full mt-1 text-popover-foreground rounded-md border border-border shadow-lg max-h-60 overflow-auto"
              style={{ backgroundColor: 'var(--popover)' }}
            >
              {children}
            </div>
          )}
        </div>
      </SelectContext.Provider>
    );
  }
);
Select.displayName = 'Select';

export interface SelectOptionProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const SelectOption = React.forwardRef<HTMLDivElement, SelectOptionProps>(
  ({ className, children, value: optionValue, disabled, ...props }, ref) => {
    const { value, onChange } = useSelectContext();
    const isSelected = value === optionValue;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center w-full px-3 py-2 text-sm cursor-pointer select-none bg-transparent',
          'transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:bg-accent focus:text-accent-foreground',
          isSelected && 'bg-accent text-accent-foreground',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={() => {
          if (!disabled) {
            onChange?.(optionValue);
          }
        }}
        {...props}
      >
        <span className="flex-1">{children}</span>
        {isSelected && <Check className="h-4 w-4 ml-2" />}
      </div>
    );
  }
);
SelectOption.displayName = 'SelectOption';

export { Select, SelectOption };

