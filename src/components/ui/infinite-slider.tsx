'use client';

import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type InfiniteSliderProps = {
  children: ReactNode;
  gap?: number;
  duration?: number;
  durationOnHover?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  duration,
  durationOnHover,
  speed,
  speedOnHover,
  direction = 'horizontal',
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const baseDuration = speed ?? duration ?? 25;
  const axis = direction === 'horizontal' ? 'X' : 'Y';
  const animationName = reverse ? `infinite-slider-reverse-${axis}` : `infinite-slider-${axis}`;
  const style = {
    '--slider-gap': `${gap}px`,
    '--slider-duration': `${baseDuration}s`,
  } as CSSProperties;

  void durationOnHover;
  void speedOnHover;

  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        className="flex w-max"
        style={{
          ...style,
          gap: 'var(--slider-gap)',
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          animationName,
          animationDuration: 'var(--slider-duration)',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          willChange: 'transform',
        }}
      >
        {children}
        {children}
      </div>
      <style>{`
        @keyframes infinite-slider-X {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(calc(-50% - (var(--slider-gap) / 2)), 0, 0);
          }
        }

        @keyframes infinite-slider-reverse-X {
          from {
            transform: translate3d(calc(-50% - (var(--slider-gap) / 2)), 0, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes infinite-slider-Y {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(0, calc(-50% - (var(--slider-gap) / 2)), 0);
          }
        }

        @keyframes infinite-slider-reverse-Y {
          from {
            transform: translate3d(0, calc(-50% - (var(--slider-gap) / 2)), 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
