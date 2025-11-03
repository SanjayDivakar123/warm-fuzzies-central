import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

export const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Beehiiv API endpoint - replace with your actual publication ID
      const response = await fetch("https://api.beehiiv.com/v2/publications/pub_0ca6cfd6-fe95-4e26-8ace-76fff956f217/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_BEEHIIV_API_KEY", // This should be in env variables
        },
        body: JSON.stringify({
          email: email.trim(),
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: "website",
          utm_medium: "newsletter_form"
        }),
      });

      if (response.ok) {
        toast({
          title: "You're in.",
          description: "Check your email for the first drop.",
        });
        setEmail("");
      } else {
        throw new Error("Subscription failed");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Something broke.",
        description: "Try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-black border-2 border-cyan-500/50 text-white placeholder:text-white/40 text-lg px-6 py-6 focus:border-cyan-500 focus:ring-0 focus:ring-offset-0"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-cyan-500 text-black hover:bg-cyan-400 border-0 text-lg px-10 py-6 font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
        >
          {isLoading ? "..." : "Subscribe"}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
      <p className="text-white/40 text-sm mt-4 text-center">
        No spam. Unsubscribe anytime. We don't do corporate nonsense.
      </p>
    </form>
  );
};
