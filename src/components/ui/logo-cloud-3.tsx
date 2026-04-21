'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';

import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { cn } from '@/lib/utils';

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  dedupeKey?: string;
};

type LogoCloudProps = ComponentProps<'div'> & {
  logos: Logo[];
};

const getLogoKey = (logo: Logo) =>
  (logo.dedupeKey ?? logo.alt.replace(/\s+logo$/i, '').toLowerCase()).trim();

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  const [hiddenLogos, setHiddenLogos] = useState<Record<string, true>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setHiddenLogos({});
    setIsReady(false);
  }, [logos]);

  const uniqueLogos = useMemo(() => {
    const seen = new Set<string>();

    return logos.filter((logo) => {
      const key = getLogoKey(logo);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [logos]);

  const visibleLogos = useMemo(
    () => uniqueLogos.filter((logo) => !hiddenLogos[getLogoKey(logo)]),
    [hiddenLogos, uniqueLogos],
  );

  useEffect(() => {
    if (!visibleLogos.length) {
      setIsReady(true);
      return;
    }

    let cancelled = false;

    Promise.all(
      visibleLogos.map(
        (logo) =>
          new Promise<void>((resolve) => {
            const image = new Image();

            image.onload = () => resolve();
            image.onerror = () => {
              if (!cancelled) {
                setHiddenLogos((current) => {
                  const key = getLogoKey(logo);

                  if (current[key]) {
                    return current;
                  }

                  return {
                    ...current,
                    [key]: true,
                  };
                });
              }

              resolve();
            };
            image.decoding = 'async';
            image.src = logo.src;
          }),
      ),
    ).then(() => {
      if (!cancelled) {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visibleLogos]);

  if (!visibleLogos.length) {
    return null;
  }

  return (
    <div
      {...props}
      className={cn(
        'overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]',
        !isReady && 'pointer-events-none',
        className,
      )}
    >
      <InfiniteSlider
        className={cn('transition-opacity duration-300', isReady ? 'opacity-100' : 'opacity-0')}
        gap={24}
        reverse
        pixelsPerSecond={84}
      >
        {visibleLogos.map((logo) => (
          <div
            key={`logo-${getLogoKey(logo)}`}
            className="flex h-14 min-w-[156px] items-center justify-center rounded-2xl border border-border/60 bg-card/85 px-5 shadow-sm backdrop-blur-sm md:min-w-[184px]"
          >
            <img
              alt={logo.alt}
              className="pointer-events-none h-7 w-auto select-none object-contain opacity-95 md:h-8"
              decoding="async"
              height={logo.height || 'auto'}
              loading="eager"
              onError={() => {
                setHiddenLogos((current) => {
                  const key = getLogoKey(logo);

                  if (current[key]) {
                    return current;
                  }

                  return {
                    ...current,
                    [key]: true,
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
