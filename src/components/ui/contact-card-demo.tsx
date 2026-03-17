import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContactCard } from "@/components/ui/contact-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactCardDemo() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-4">
      <div className="mx-auto max-w-5xl">
        <ContactCard
          title="Get in touch"
          description="If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day."
          contactInfo={[
            {
              icon: MailIcon,
              label: "Email",
              value: "contact@rolecolorfinder.com",
            },
            {
              icon: PhoneIcon,
              label: "Phone",
              value: "+1 (510) 555-0178",
            },
            {
              icon: MapPinIcon,
              label: "Address",
              value: "Berkeley, California",
              className: "col-span-2",
            },
          ]}
        >
          <form className="w-full space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input type="text" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email</Label>
              <Input type="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Phone</Label>
              <Input type="tel" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Message</Label>
              <Textarea />
            </div>
            <Button className="w-full" type="button">
              Submit
            </Button>
          </form>
        </ContactCard>
      </div>
    </main>
  );
}
