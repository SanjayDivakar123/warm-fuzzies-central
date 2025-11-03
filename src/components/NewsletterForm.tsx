import { useState } from "react";
import { ArrowRight, X } from "lucide-react";

export const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [magicLink, setMagicLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      return;
    }

    // Generate Beehiiv magic link
    const link = `https://magic.beehiiv.com/v1/0dcd8602-c0c7-4b37-a014-c224ffd4b0eb?email=${encodeURIComponent(email.trim())}`;
    setMagicLink(link);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    window.open(magicLink, '_blank');
    setShowConfirm(false);
    setEmail("");
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative bg-black border-2 border-cyan-500 max-w-md w-full mx-4 p-8 space-y-6">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white uppercase tracking-tight">
                Almost there.
              </h3>
              <p className="text-lg text-white/80">
                Click confirm to complete your subscription to The Shift.
              </p>
              <p className="text-base text-cyan-400">
                {email}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full bg-cyan-500 text-black hover:bg-cyan-400 border-0 text-lg px-8 py-4 font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-105"
              >
                Confirm Subscription
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full bg-transparent text-white/60 hover:text-white border-0 text-sm uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
