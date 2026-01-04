import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  title: string;
  content: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  return (
    <div className={cn("w-full", className)}>
      <Accordion type="single" collapsible className="w-full space-y-3">
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="group rounded-2xl border border-border/50 bg-card/50 px-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 data-[state=open]:border-primary/50 data-[state=open]:bg-card"
          >
            <AccordionTrigger className="py-5 hover:no-underline [&>svg]:hidden">
              <div className="flex w-full items-center justify-between gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition-colors group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                  {item.id}
                </span>
                <span className="flex-1 text-left text-lg font-semibold text-foreground transition-colors group-hover:text-primary group-data-[state=open]:text-primary">
                  {item.title}
                </span>
                <PlusIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:text-primary" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 pl-14 pr-4 text-base leading-relaxed text-muted-foreground">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
