"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Used By",
  logos = [
    {
      id: "logo-houj",
      description: "HOUJ",
      image: "/Used%20By%20Logos/houj-logo.webp",
      className: "h-8 w-auto brightness-0 saturate-100",
    },
    {
      id: "logo-tedx3w",
      description: "TEDx3W",
      image: "/Used%20By%20Logos/tedx3w-logo.avif",
      className: "h-8 w-auto",
    },
    {
      id: "logo-paf",
      description: "PAF",
      image: "/Used%20By%20Logos/paf-logo.png",
      className: "h-8 w-auto",
    },
  ],
  className,
}: Logos3Props) => {
  const displayLogos = [...logos, ...logos, ...logos];

  return (
    <section className={cn("py-4", className)}>
      <div className="container-wide">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border/60 bg-card/70 px-4 py-5 backdrop-blur-sm">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {heading}
          </h2>

          <div className="pt-4">
            <div className="relative mx-auto flex items-center justify-center">
          <Carousel
            opts={{ loop: true, align: "start" }}
            plugins={[AutoScroll({ playOnInit: true, speed: 0.9, stopOnInteraction: false })]}
          >
            <CarouselContent className="ml-0">
              {displayLogos.map((logo, index) => (
                <CarouselItem
                  key={`${logo.id}-${index}`}
                  className="flex basis-1/2 justify-center pl-0 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <div className="mx-2 flex h-16 w-full shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background px-4 py-3 shadow-sm">
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={cn("h-9 w-auto object-contain", logo.className)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
              <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
              <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
