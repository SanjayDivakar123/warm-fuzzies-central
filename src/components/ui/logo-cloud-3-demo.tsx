import { LogoCloud } from '@/components/ui/logo-cloud-3';
import abcNewsLogo from '@/assets/abc-news.png';
import apLogo from '@/assets/ap.svg';
import cbsNewsLogo from '@/assets/cbs-news.svg';
import foxNewsChannelLogo from '@/assets/fox-news-channel.svg';
import { HOMEPAGE_PLATFORM_LOGOS } from '@/lib/integrationLogos';
import { cn } from '@/lib/utils';

const AS_FEATURED_IN_LOGOS = [
  {
    src: foxNewsChannelLogo,
    alt: 'Fox News Channel logo',
    imageClassName: 'h-12',
  },
  {
    src: cbsNewsLogo,
    alt: 'CBS News logo',
    imageClassName: 'h-9',
  },
  {
    src: abcNewsLogo,
    alt: 'ABC News logo',
    imageClassName: 'h-10',
  },
  {
    src: apLogo,
    alt: 'AP logo',
    imageClassName: 'h-9',
  },
] as const;

export default function LogoCloud3Demo() {
  return (
    <div className="relative w-full place-content-center space-y-8">
      <section className="relative mx-auto max-w-6xl">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          As Featured In
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {AS_FEATURED_IN_LOGOS.map((logo) => (
            <div
              key={logo.alt}
              className="flex h-16 items-center justify-center rounded-xl border border-border/60 bg-card/80 px-4 shadow-sm backdrop-blur-sm"
            >
              <img
                alt={logo.alt}
                className={cn(
                  'pointer-events-none w-auto max-w-full select-none object-contain opacity-95',
                  logo.imageClassName,
                )}
                loading="lazy"
                src={logo.src}
              />
            </div>
          ))}
        </div>
      </section>

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-1/2 top-0 -z-10 h-[60vmin] w-[60vmin] -translate-x-1/2 rounded-full',
          'bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.14),transparent_65%)] blur-[30px]',
        )}
      />

      <section className="relative mx-auto max-w-6xl">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Platforms we connect with
        </p>
        <LogoCloud className="mt-4" logos={HOMEPAGE_PLATFORM_LOGOS} />
      </section>
    </div>
  );
}
