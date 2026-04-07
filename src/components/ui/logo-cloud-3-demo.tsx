import { LogoCloud } from '@/components/ui/logo-cloud-3';
import { HOMEPAGE_PLATFORM_LOGOS } from '@/lib/integrationLogos';
import { cn } from '@/lib/utils';

export default function LogoCloud3Demo() {
  return (
    <div className="relative w-full place-content-center">
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
