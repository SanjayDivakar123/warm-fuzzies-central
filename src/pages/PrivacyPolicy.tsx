import { useEffect } from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  useEffect(() => {
    const title = "Privacy Policy | Site";
    const description = "Privacy Policy: how we collect, use, and protect your personal data.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/privacy-policy`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy",
      url: canonicalHref,
      description,
    };

    let scriptEl = document.getElementById("jsonld-privacy") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-privacy";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-foreground">Privacy Policy</span>
          </nav>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Your privacy matters. This policy explains what we collect, why, and how we protect it.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <article className="mx-auto max-w-3xl space-y-10">
          <section>
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <p className="mt-3 text-muted-foreground">
              We may collect information you provide directly (like name, email), usage data (pages visited, actions taken), and device data
              (browser type, IP address). For payments, processing is handled by our secure payment provider; we do not store full card details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. How We Use Information</h2>
            <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-2">
              <li>Operate, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Provide customer support and respond to requests</li>
              <li>Personalize experiences and communicate updates</li>
              <li>Protect against fraud, abuse, or security risks</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Cookies & Tracking</h2>
            <p className="mt-3 text-muted-foreground">
              We use cookies and similar technologies to remember preferences, measure performance, and analyze traffic. You can control cookies
              through your browser settings; disabling cookies may affect certain features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Data Sharing</h2>
            <p className="mt-3 text-muted-foreground">
              We do not sell your personal information. We may share limited data with trusted service providers (e.g., analytics, payments) under
              contracts that require appropriate safeguards and use only for specified purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Data Security</h2>
            <p className="mt-3 text-muted-foreground">
              We implement administrative, technical, and physical safeguards designed to protect your information. However, no method of
              transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Your Rights</h2>
            <p className="mt-3 text-muted-foreground">
              Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data.
              To exercise these rights, contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Contact Us</h2>
            <p className="mt-3 text-muted-foreground">
              If you have questions about this policy or our data practices, please contact us at
              <a href="mailto:privacy@example.com" className="ml-1 underline underline-offset-4 hover:text-foreground">privacy@example.com</a>.
            </p>
          </section>

          <aside className="rounded-lg border p-4 text-sm text-muted-foreground">
            Looking for pricing? <Link to="/pricing" className="underline underline-offset-4 hover:text-foreground">View plans</Link>.
          </aside>

          <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
