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
    id: 2,
    name: "Sarah Mitchell",
    role: "Chief Executive Officer",
    company: "Nexus Innovations",
    quote: "RoleColorFinder transformed how our executive team communicates. We finally understand each other's leadership styles and can adapt our approach accordingly.",
    rating: 5,
  },
  {
    id: 3,
    name: "Marcus Chen",
    role: "CEO & Co-Founder",
    company: "TechVenture Labs",
    quote: "As a startup founder, understanding my leadership color helped me build a more balanced founding team. The insights are actionable and immediately applicable.",
    rating: 5,
  },
  {
    id: 4,
    name: "Jennifer Blackwell",
    role: "Chief People Officer",
    company: "Global Dynamics Inc.",
    quote: "We rolled this out to 500+ employees. The improvement in team collaboration and reduced conflict has been measurable and significant.",
    rating: 5,
  },
  {
    id: 5,
    name: "Robert Kimura",
    role: "Managing Partner",
    company: "Apex Capital Partners",
    quote: "The Tuckman framework integration is brilliant. It helped our portfolio companies understand team dynamics at every growth stage.",
    rating: 5,
  },
  {
    id: 6,
    name: "Amanda Torres",
    role: "CEO",
    company: "Elevate Healthcare Solutions",
    quote: "In healthcare leadership, understanding contextual adaptation is critical. RoleColorFinder gave our directors the language to discuss leadership effectively.",
    rating: 5,
  },
  {
    id: 7,
    name: "David Okonkwo",
    role: "Chief Strategy Officer",
    company: "Meridian Consulting Group",
    quote: "We use RoleColorFinder in our executive coaching practice. Clients love the practical, science-backed approach to understanding their leadership DNA.",
    rating: 5,
  },
  {
    id: 8,
    name: "Lisa Fernandez",
    role: "VP of Talent Development",
    company: "Fortune 500 Tech Company",
    quote: "Finally, an assessment that goes beyond static personality types. The contextual leadership framework resonates with modern organizational needs.",
    rating: 5,
  },
  {
    id: 9,
    name: "Michael Brennan",
    role: "Founder & CEO",
    company: "Brennan Ventures",
    quote: "I have taken countless leadership assessments. This is the first one that actually explained WHY I lead differently in different situations.",
    rating: 5,
  },
  {
    id: 10,
    name: "Priya Sharma",
    role: "Chief Operating Officer",
    company: "Synergy Tech Solutions",
    quote: "The team color mapping feature helped us identify gaps in our leadership coverage. We made two strategic hires based on the insights.",
    rating: 5,
  },
  {
    id: 11,
    name: "Thomas Wright",
    role: "Executive Director",
    company: "Wright Foundation",
    quote: "Non-profit leadership requires adaptability. RoleColorFinder helped our board understand how to leverage diverse leadership styles for mission impact.",
    rating: 5,
  },
  {
    id: 12,
    name: "Katherine Park",
    role: "CEO",
    company: "Bloom Digital Agency",
    quote: "My creative team now understands why I push for structure during crunch time. The color system makes complex leadership concepts accessible.",
    rating: 5,
  },
  {
    id: 13,
    name: "James Morrison",
    role: "Chief Innovation Officer",
    company: "Pioneer Industries",
    quote: "The assessment revealed blind spots I did not know I had. It is rare to find a tool that is both scientifically rigorous and practically useful.",
    rating: 5,
  },
  {
    id: 14,
    name: "Elena Rodriguez",
    role: "Managing Director",
    company: "Catalyst Growth Partners",
    quote: "We integrate RoleColorFinder into all our leadership development programs. The ROI on team performance has exceeded our expectations.",
    rating: 5,
  },
  {
    id: 15,
    name: "Andrew Walsh",
    role: "CEO & Founder",
    company: "Horizon SaaS Platform",
    quote: "Understanding my Yellow-dominant profile helped me hire complementary leaders. Our executive team is now truly balanced and high-performing.",
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
