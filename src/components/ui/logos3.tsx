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
  heading = "We Work With",
  logos = [
    {
      id: "logo-houj",
      description: "HOUJ",
      image: "/Used%20By%20Logos/houj-logo.webp",
      className: "h-8 w-auto brightness-0 saturate-100",
    },
    {
      id: "logo-paf",
      description: "PAF",
      image: "/Used%20By%20Logos/paf-logo.png",
      className: "h-8 w-auto",
    },
    {
      id: "logo-sg",
      description: "SG",
      image: "/Used%20By%20Logos/sg-logo.svg",
      className: "h-8 w-auto",
    },
  ],
  className,
}: Logos3Props) => {
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
            plugins={[AutoScroll({ playOnInit: true, speed: 0.8, stopOnInteraction: false })]}
          >
            <CarouselContent className="ml-0">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="flex basis-1/2 justify-center pl-0 sm:basis-1/3 md:basis-1/3 lg:basis-1/3"
                >
                  <div className="mx-1.5 flex h-12 w-full shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background px-3 py-2 shadow-sm">
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={cn("h-6 w-auto object-contain", logo.className)}
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
