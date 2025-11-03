import { ArrowRight } from "lucide-react";

export const NewsletterForm = () => {
  return (
    <form
      action="https://embeds.beehiiv.com/v1/0dcd8602-c0c7-4b37-a014-c224ffd4b0eb/subscribe"
      method="post"
      target="_blank"
      className="max-w-2xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          name="email"
          placeholder="Your email"
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
