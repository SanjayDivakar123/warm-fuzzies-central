"use client";
import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

export interface TestimonialItem {
  text: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  const duration = props.duration || 10;
  
  return (
    <div className={props.className}>
      <motion.div
        key={duration}
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, role }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full bg-background" key={`${index}-${i}`}>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className="w-5 h-5 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </div>
                  <div className="text-foreground">{text}</div>
                  <div className="flex flex-col mt-5">
                    <div className="font-medium tracking-tight leading-5 text-foreground">{name}</div>
                    <div className="leading-5 opacity-60 tracking-tight text-muted-foreground">{role}</div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

