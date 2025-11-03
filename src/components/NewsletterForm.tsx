import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const NewsletterForm = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to Beehiiv magic link
    const magicLink = `https://magic.beehiiv.com/v1/0dcd8602-c0c7-4b37-a014-c224ffd4b0eb?email=${encodeURIComponent(email.trim())}`;
    window.open(magicLink, '_blank');
    
    toast({
      title: "Check your email",
      description: "Confirm your subscription to start receiving The Shift.",
    });
    
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          name="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 bg-black border-2 border-cyan-500/50 text-white placeholder:text-white/40 text-lg px-6 py-6 focus:border-cyan-500 focus:ring-0 focus:outline-none focus:ring-offset-0 transition-colors"
        />
        <button
          type="submit"
          className="bg-cyan-500 text-black hover:bg-cyan-400 border-0 text-lg px-10 py-6 font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-105"
        >
          Subscribe
          <ArrowRight className="inline ml-2 w-5 h-5" />
        </button>
      </div>
      <p className="text-white/40 text-sm mt-4 text-center">
        No spam. Unsubscribe anytime. We don't do corporate nonsense.
      </p>
    </form>
  );
};
