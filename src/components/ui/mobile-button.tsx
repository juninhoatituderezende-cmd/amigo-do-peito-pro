import React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface MobileButtonProps extends ButtonProps {
  touchOptimized?: boolean;
}

export const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, touchOptimized = true, children, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(event);
      }
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLButtonElement>) => {
      // Previne duplo toque
      event.preventDefault();
      
      if (onClick) {
        const syntheticEvent = {
          ...event,
          currentTarget: event.currentTarget,
          target: event.target
        } as any;
        onClick(syntheticEvent);
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          touchOptimized && [
            'min-h-[44px]',
            'min-w-[44px]',
            'touch-manipulation',
            'select-none',
            'text-base',
            'px-4',
            'py-3'
          ],
          className
        )}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MobileButton.displayName = 'MobileButton';