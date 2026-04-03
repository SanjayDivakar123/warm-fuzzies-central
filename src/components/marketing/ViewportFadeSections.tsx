import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Soft crossfade: map scroll progress [0,1] across (n-1) transitions so ends are solid. */
function opacityForSection(i: number, n: number, p: number) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  const s = p * (n - 1);
  const w = 0.78;
  return Math.max(0, Math.min(1, 1 - Math.abs(s - i) / w));
}

type ViewportFadeSectionsProps = {
  /** One full-screen slide each (below navbar). */
  sections: React.ReactNode[];
  className?: string;
  /** Viewport height under the fixed navbar. */
  viewportHeightClassName?: string;
  /** Optional persistent content shown above every pinned slide. */
  persistentHeader?: React.ReactNode;
  /** Optional callback with the floating CTA opacity for page-level fixed UI. */
  onFloatingFooterOpacityChange?: (opacity: number) => void;
};

export function ViewportFadeSections({
  sections: sectionsProp,
  className,
  viewportHeightClassName = "h-[calc(100dvh-5rem)]",
  persistentHeader,
  onFloatingFooterOpacityChange,
}: ViewportFadeSectionsProps) {
  const slides = useMemo(() => sectionsProp.filter(Boolean), [sectionsProp]);
  const n = slides.length;
  const triggerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prefersReduced = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  useLayoutEffect(() => {
    if (prefersReduced || n === 0) return;
    const trigger = triggerRef.current;
    const pin = pinRef.current;
    if (!trigger || !pin) return;

    const ctx = gsap.context(() => {
      const applyOpacities = (progress: number) => {
        layerRefs.current.forEach((el, i) => {
          if (!el) return;
          const o = opacityForSection(i, n, progress);
          gsap.set(el, { autoAlpha: o });
        });
      };

      applyOpacities(0);

        ScrollTrigger.create({
        trigger,
        // Start pinning as soon as the story reaches the top so there is only
        // one continuous scroll phase instead of a pre-pin scroll and then a pin.
        start: "top top",
        end: () => `+=${Math.max(window.innerHeight, 480) * n * 2.2}`,
        pin: pin,
        pinSpacing: true,
        scrub: 0.2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
         onUpdate: (self) => {
           applyOpacities(self.progress);
           const fadeStart = 0.965;
           const nextOpacity =
             self.progress <= fadeStart ? 1 : Math.max(0, 1 - (self.progress - fadeStart) / (1 - fadeStart));
           onFloatingFooterOpacityChange?.(nextOpacity);
         },
         onToggle: (self) => {
          const root = document.documentElement;
          if (self.isActive) {
            root.setAttribute("data-rc-story-pin", "");
            onFloatingFooterOpacityChange?.(1);
          } else {
            root.removeAttribute("data-rc-story-pin");
            onFloatingFooterOpacityChange?.(0);
          }
        },
       });
     }, trigger);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
      document.documentElement.removeAttribute("data-rc-story-pin");
    };
  }, [n, onFloatingFooterOpacityChange, prefersReduced]);

  if (n === 0) return null;

  if (prefersReduced) {
    return (
      <div className={cn("w-full", className)}>
        {persistentHeader ? <div className="w-full">{persistentHeader}</div> : null}
        {slides.map((slide, i) => (
          <div
            key={i}
            className="min-h-[calc(100dvh-5rem)] border-b border-border/60 py-8 flex flex-col"
          >
            {slide}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={triggerRef}
      className={cn("relative w-full", className)}
      style={{ minHeight: `${n * 95}vh` }}
      aria-label="Product story sections"
    >
      <div
        ref={pinRef}
        className={cn(
          "relative z-0 flex w-full flex-col overflow-hidden bg-background pointer-events-none",
          viewportHeightClassName
        )}
      >
        {persistentHeader ? <div className="shrink-0 pointer-events-none">{persistentHeader}</div> : null}
        {/* pointer-events-none lets wheel/touch scroll reach the page; slides are display-only */}
        <div className="relative h-full min-h-0 w-full flex-1 pointer-events-none">
          {slides.map((slide, i) => (
            <div
              key={i}
              ref={(el) => {
                layerRefs.current[i] = el;
              }}
              className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none"
              style={{ visibility: i === 0 ? "visible" : "hidden", opacity: i === 0 ? 1 : 0 }}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
