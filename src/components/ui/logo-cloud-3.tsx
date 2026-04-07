'use client';

import { useEffect, useState, type ComponentProps } from 'react';

import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { cn } from '@/lib/utils';

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = ComponentProps<'div'> & {
  logos: Logo[];
};

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  const [hiddenLogos, setHiddenLogos] = useState<Record<string, true>>({});

  useEffect(() => {
    setHiddenLogos({});
  }, [logos]);

  const visibleLogos = logos.filter((logo) => !hiddenLogos[logo.alt]);

  if (!visibleLogos.length) {
    return null;
  }

  return (
    <div
      {...props}
      className={cn(
        'overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]',
        className,
      )}
    >
      <InfiniteSlider gap={42} reverse duration={96} durationOnHover={180}>
        {visibleLogos.map((logo) => (
          <div
            key={`logo-${logo.alt}`}
            className="flex h-12 min-w-[128px] items-center justify-center rounded-xl border border-border/60 bg-card/80 px-4 shadow-sm backdrop-blur-sm"
          >
            <img
              alt={logo.alt}
              className="pointer-events-none h-6 w-auto select-none object-contain opacity-95 md:h-7"
              height={logo.height || 'auto'}
              loading="lazy"
              onError={() => {
                setHiddenLogos((current) => {
                  if (current[logo.alt]) {
                    return current;
                  }

                  return {
                    ...current,
                    [logo.alt]: true,
                  };
                });
              }}
              src={logo.src}
              width={logo.width || 'auto'}
            />
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
