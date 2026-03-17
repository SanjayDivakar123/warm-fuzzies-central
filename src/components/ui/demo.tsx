"use client";

import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import dashboardPreview from "@/assets/dashboard-preview-v4.png";

export function HeroScrollDemo() {
  return (
    <section className="flex flex-col overflow-hidden pb-20 pt-10 md:pb-28 md:pt-16">
      <ContainerScroll
        titleComponent={
          <div className="mx-auto max-w-4xl px-4">
            <h1 className="text-balance text-4xl font-black leading-[1.02] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Lead with
              <span className="mx-2 inline-block bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                clarity
              </span>
              across every team stage
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg lg:text-xl">
              Turn assessment insights into practical leadership action with a dashboard built for speed,
              visibility, and better decisions.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm md:text-base">
              <span className="rounded-full border border-border bg-background/80 px-4 py-2 font-medium text-foreground/90 backdrop-blur">
                Real-time color insights
              </span>
              <span className="rounded-full border border-border bg-background/80 px-4 py-2 font-medium text-foreground/90 backdrop-blur">
                Team-ready reports
              </span>
              <span className="rounded-full border border-border bg-background/80 px-4 py-2 font-medium text-foreground/90 backdrop-blur">
                Built for managers and founders
              </span>
            </div>
          </div>
        }
      >
        <img
          src={dashboardPreview}
          alt="RoleColor dashboard preview"
          className="mx-auto h-full w-full rounded-2xl object-cover object-top"
          draggable={false}
        />
      </ContainerScroll>
    </section>
  );
}
