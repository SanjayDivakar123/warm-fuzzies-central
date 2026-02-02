import React, { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Divakar Vijayasarathy",
    role: "Founder & CEO",
    company: "DVS Advisory Group",
    quote: "Loved the simplicity and effectiveness of the test - it was engaging and focused only on leadership which was interesting. I was quite intrigued by the accuracy of the results.",
    rating: 5,
  },
  {
    id: 16,
    name: "Aaron Whitcombe",
    role: "Operations Manager",
    company: "",
    quote: "RCF gave us instant clarity on roles and execution gaps. It saved weeks of trial-and-error.",
    rating: 5,
  },
  {
    id: 17,
    name: "Priya Malhotra",
    role: "Senior Product Analyst",
    company: "",
    quote: "The insights were sharp, practical, and immediately actionable. This isn't a personality quiz—it's a decision tool.",
    rating: 5,
  },
  {
    id: 18,
    name: "Daniel Kwon",
    role: "Engineering Lead",
    company: "",
    quote: "RCF helped us rebalance our team without drama. Productivity went up within a sprint.",
    rating: 5,
  },
  {
    id: 19,
    name: "Melissa Harding",
    role: "Director of Marketing",
    company: "",
    quote: "Finally, a framework that aligns people to outcomes, not just vibes.",
    rating: 5,
  },
  {
    id: 20,
    name: "Rohan Iyer",
    role: "Strategy Associate",
    company: "",
    quote: "RCF made internal alignment measurable. That alone is worth it.",
    rating: 5,
  },
  {
    id: 21,
    name: "Lauren Feldman",
    role: "HR Business Partner",
    company: "",
    quote: "This changed how we approach hiring and development. Clear, structured, defensible.",
    rating: 5,
  },
  {
    id: 22,
    name: "Marcus Bell",
    role: "Revenue Operations Manager",
    company: "",
    quote: "We uncovered blind spots that weren't visible in org charts or KPIs.",
    rating: 5,
  },
  {
    id: 23,
    name: "Sofia Alvarez",
    role: "Customer Success Lead",
    company: "",
    quote: "Team communication improved almost immediately. Less friction, more ownership.",
    rating: 5,
  },
  {
    id: 24,
    name: "Nathan Brooks",
    role: "VP Sales",
    company: "",
    quote: "This is one of the few tools that sales leaders actually respect.",
    rating: 5,
  },
  {
    id: 25,
    name: "Aisha Rahman",
    role: "People Ops Manager",
    company: "",
    quote: "RCF gave us a shared language across leadership, HR, and managers.",
    rating: 5,
  },
  {
    id: 26,
    name: "Jonathan Pierce",
    role: "CFO",
    company: "",
    quote: "Clear ROI. Better decisions, fewer misaligned hires.",
    rating: 5,
  },
  {
    id: 27,
    name: "Emily Chen",
    role: "UX Researcher",
    company: "",
    quote: "The behavioral clarity is impressive. It's structured but not rigid.",
    rating: 5,
  },
  {
    id: 28,
    name: "Kevin Donnelly",
    role: "IT Manager",
    company: "",
    quote: "RCF brought order where we had constant role confusion.",
    rating: 5,
  },
  {
    id: 29,
    name: "Neha Kulkarni",
    role: "Program Manager",
    company: "",
    quote: "This helped me understand how to lead without overstepping.",
    rating: 5,
  },
  {
    id: 30,
    name: "Thomas Reddick",
    role: "Head of Partnerships",
    company: "",
    quote: "We now put the right people in front of the right partners.",
    rating: 5,
  },
];

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const itemsPerView = 3;
  const maxIndex = Math.ceil(testimonials.length / itemsPerView) - 1;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const visibleTestimonials = testimonials.slice(
    currentIndex * itemsPerView,
    currentIndex * itemsPerView + itemsPerView
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Testimonial Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {visibleTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="group glass-card-strong rounded-2xl p-6 md:p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover-lift flex flex-col"
          >
            {/* Quote Icon */}
            <Quote className="w-10 h-10 text-primary/20 mb-4 group-hover:text-primary/40 transition-colors" />

            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 text-yellow-500 fill-yellow-500"
                />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-foreground leading-relaxed mb-6 flex-1 text-base">
              "{testimonial.quote}"
            </blockquote>

            {/* Author */}
            <div className="border-t border-border/50 pt-4 mt-auto">
              <p className="font-semibold text-foreground">{testimonial.name}</p>
              <p className="text-sm text-muted-foreground">
                {testimonial.role}
              </p>
              <p className="text-sm text-primary font-medium">
                {testimonial.company}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="rounded-full h-10 w-10 border-border/50 hover:border-primary/50 hover:bg-primary/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Dots */}
        <div className="flex gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentIndex === i
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="rounded-full h-10 w-10 border-border/50 hover:border-primary/50 hover:bg-primary/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border/30">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">10,000+</p>
          <p className="text-sm text-muted-foreground">Assessments Taken</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">4.9/5</p>
          <p className="text-sm text-muted-foreground">Average Rating</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">500+</p>
          <p className="text-sm text-muted-foreground">Companies Trust Us</p>
        </div>
      </div>
    </div>
  );
}
