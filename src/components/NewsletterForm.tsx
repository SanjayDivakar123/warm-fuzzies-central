import { useState, useEffect } from "react";

export const NewsletterForm = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Show success message after 10 seconds
    const timer = setTimeout(() => {
      setIsSubscribed(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

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
    <div className="max-w-2xl mx-auto">
      <iframe
        src="https://magic.beehiiv.com/v1/0dcd8602-c0c7-4b37-a014-c224ffd4b0eb"
        className="w-full h-[400px] border-2 border-cyan-500/50"
        title="Subscribe to The Shift"
      />
      <p className="text-white/40 text-sm mt-4 text-center">
        No spam. Unsubscribe anytime. We don't do corporate nonsense.
      </p>
    </div>
  );
};
