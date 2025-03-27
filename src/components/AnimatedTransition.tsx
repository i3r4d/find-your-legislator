
import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTransitionProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}

const AnimatedTransition = ({ children, show, className }: AnimatedTransitionProps) => {
  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out transform',
        show 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
    >
      {children}
    </div>
  );
};

export default AnimatedTransition;
