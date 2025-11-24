import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-[#ff9329] text-black hover:bg-[#e58625] cursor-pointer',
        default_disabled: 'bg-[#ff9329] text-black opacity-50 cursor-not-allowed',
        secondary: 'border border-[#ff9329] text-[#ff9329] cursor-pointer',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive cursor-pointer',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer',
        outline_disabled: 'border border-input bg-background text-muted-foreground opacity-50 cursor-not-allowed',
        ghost: 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
        link: 'text-primary underline-offset-4 hover:underline cursor-pointer',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
