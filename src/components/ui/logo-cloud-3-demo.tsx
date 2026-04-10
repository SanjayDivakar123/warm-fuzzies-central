import { LogoCloud } from '@/components/ui/logo-cloud-3';
import { HOMEPAGE_PLATFORM_LOGOS } from '@/lib/integrationLogos';
import { cn } from '@/lib/utils';

const AS_FEATURED_IN_LOGOS = [
  {
    src: 'https://logo.clearbit.com/foxnews.com',
    alt: 'Fox News logo',
  },
  {
    src: 'https://logo.clearbit.com/cbsnews.com',
    alt: 'CBS News logo',
  },
  {
    src: 'https://logo.clearbit.com/abcnews.go.com',
    alt: 'ABC News logo',
  },
  {
    src: 'https://logo.clearbit.com/apnews.com',
    alt: 'Associated Press logo',
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
                className="pointer-events-none h-8 w-auto select-none object-contain opacity-95"
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
