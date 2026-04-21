'use client';

import {
  Children,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

type InfiniteSliderProps = {
  children: ReactNode;
  gap?: number;
  duration?: number;
  durationOnHover?: number;
  speed?: number;
  speedOnHover?: number;
  pixelsPerSecond?: number;
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
  pixelsPerSecond,
  direction = 'horizontal',
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(0);
  const [groupSize, setGroupSize] = useState(0);

  const items = useMemo(() => Children.toArray(children), [children]);
  const distance = groupSize > 0 ? groupSize + gap : 0;
  const resolvedPixelsPerSecond =
    pixelsPerSecond ?? (speed && distance > 0 ? distance / speed : undefined) ?? (duration && distance > 0 ? distance / duration : undefined) ?? 50;
  const groupCopies =
    groupSize > 0 && containerSize > 0
      ? Math.max(2, Math.ceil((containerSize + distance) / distance) + 1)
      : 2;
  const style = {
    '--slider-gap': `${gap}px`,
  } as CSSProperties;

  void durationOnHover;
  void speedOnHover;

  useEffect(() => {
    const container = containerRef.current;
    const group = groupRef.current;

    if (!container || !group) {
      return;
    }

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const groupRect = group.getBoundingClientRect();

      setContainerSize(direction === 'horizontal' ? containerRect.width : containerRect.height);
      setGroupSize(direction === 'horizontal' ? groupRect.width : groupRect.height);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    resizeObserver.observe(group);

    return () => {
      resizeObserver.disconnect();
    };
  }, [direction, items.length, gap]);

  useEffect(() => {
    const track = trackRef.current;

    if (!track || distance <= 0 || resolvedPixelsPerSecond <= 0) {
      return;
    }

    let frameId = 0;
    let lastTime = 0;
    let offset = reverse ? distance : 0;
    const longPauseThreshold = 120;

    const render = (time: number) => {
      if (lastTime === 0) {
        lastTime = time;
      }

      const elapsed = time - lastTime;
      lastTime = time;

      if (elapsed < longPauseThreshold) {
        const delta = resolvedPixelsPerSecond * (elapsed / 1000);
        offset = reverse ? offset - delta : offset + delta;

        if (offset >= distance) {
          offset %= distance;
        } else if (offset < 0) {
          offset = ((offset % distance) + distance) % distance;
        }
      }

      const translate = -offset;
      track.style.transform =
        direction === 'horizontal'
          ? `translate3d(${translate}px, 0, 0)`
          : `translate3d(0, ${translate}px, 0)`;

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [direction, distance, reverse, resolvedPixelsPerSecond]);

  return (
    <div ref={containerRef} className={cn('overflow-hidden', className)}>
      <div
        ref={trackRef}
        className="flex w-max"
        style={{
          ...style,
          gap: 'var(--slider-gap)',
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          willChange: 'transform',
        }}
      >
        {Array.from({ length: groupCopies }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`slider-group-${index}`}
            ref={index === 0 ? groupRef : undefined}
            aria-hidden={index > 0}
            className="flex shrink-0"
            style={{
              gap: 'var(--slider-gap)',
              flexDirection: direction === 'horizontal' ? 'row' : 'column',
            }}
          >
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
