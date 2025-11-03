import { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";

export const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      return;
    }

    setShowConfirm(true);
  };

  useEffect(() => {
    if (showConfirm) {
      // Close popup and show success after 10 seconds (when redirect happens)
      const timer = setTimeout(() => {
        setShowConfirm(false);
        setIsSubscribed(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  const handleClose = () => {
    setShowConfirm(false);
    setEmail("");
  };

  if (isSubscribed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            WELCOME TO
          </h3>
          <h2 className="text-5xl md:text-6xl font-black text-cyan-400 uppercase tracking-tight">
            THE SHIFT.
          </h2>
          <p className="text-white/60 text-lg pt-4">
            Check your email to confirm your subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
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

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative bg-black border-2 border-cyan-500 max-w-2xl w-full">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 text-cyan-500 hover:text-cyan-400 transition-colors bg-black p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <iframe
              src={`https://magic.beehiiv.com/v1/0dcd8602-c0c7-4b37-a014-c224ffd4b0eb?email=${encodeURIComponent(email.trim())}`}
              className="w-full h-[600px] border-0"
              title="Subscribe to The Shift"
            />
          </div>
        </div>
      )}
    </>
  );
};
