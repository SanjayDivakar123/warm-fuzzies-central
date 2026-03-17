import React from "react";
import { LucideIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ContactInfoProps = React.ComponentProps<"div"> & {
  icon: LucideIcon;
  label: string;
  value: string;
};

type ContactCardProps = React.ComponentProps<"div"> & {
  title?: string;
  description?: string;
  contactInfo?: ContactInfoProps[];
  formSectionClassName?: string;
};

export function ContactCard({
  title = "Contact With Us",
  description =
    "If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.",
  contactInfo,
  className,
  formSectionClassName,
  children,
  ...props
}: ContactCardProps) {
  return (
    <div
      className={cn(
        "relative grid h-full w-full border bg-card shadow md:grid-cols-2 lg:grid-cols-3",
        className
      )}
      {...props}
    >
      <PlusIcon className="absolute -left-3 -top-3 h-6 w-6" />
      <PlusIcon className="absolute -right-3 -top-3 h-6 w-6" />
      <PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6" />
      <PlusIcon className="absolute -bottom-3 -right-3 h-6 w-6" />

      <div className="flex flex-col justify-between lg:col-span-2">
        <div className="relative h-full space-y-4 px-4 py-8 md:p-8">
          <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">{title}</h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base lg:text-lg">{description}</p>
          <div className="grid gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {contactInfo?.map((info, index) => (
              <ContactInfo key={index} {...info} />
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex h-full w-full items-center border-t bg-muted/40 p-5 md:col-span-1 md:border-l md:border-t-0",
          formSectionClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ContactInfo({
  icon: Icon,
  label,
  value,
  className,
  ...props
}: ContactInfoProps) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)} {...props}>
      <div className="rounded-lg bg-muted/40 p-3">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
