import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";

const TermsOfService = () => {
  useEffect(() => {
    const title = "Terms of Service | Role Color Finder";
    const description = "Terms of Service for Role Color Finder. Read our legal terms, user agreements, and conditions for using our leadership assessment platform.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/terms-of-service`;
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
      name: "Terms of Service",
      url: canonicalHref,
      description,
    };

    let scriptEl = document.getElementById("jsonld-terms") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-terms";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10">
        <header className="mb-12">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-foreground">Terms of Service</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Please read these terms carefully before using our services.
          </p>
        </header>

        <article className="mx-auto max-w-4xl space-y-10">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Role Color Finder ("the Service"), you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Role Color Finder provides a leadership assessment platform that helps users discover their natural leadership style 
              through our patent-pending color-based diagnostic system. Our services include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Free and premium leadership assessments</li>
              <li>Personalized results and career recommendations</li>
              <li>Team development programs</li>
              <li>Educational content and resources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For paid services:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>All fees are in USD and non-refundable unless otherwise stated</li>
              <li>Payments are processed securely through our payment provider (Stripe)</li>
              <li>You authorize us to charge your payment method for all fees incurred</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>Refunds may be issued at our discretion within 7 days of purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All content, features, and functionality of the Service are owned by Role Color Finder and are protected by 
              international copyright, trademark, and other intellectual property laws. Our patent-pending assessment methodology 
              is proprietary and confidential.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You may not reproduce, distribute, modify, create derivative works, publicly display, or exploit any of our 
              proprietary content without express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any systems or data</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Impersonate any person or entity</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Scrape, copy, or reverse engineer the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Assessment Results</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our assessments are educational tools based on psychological research. Results are for informational purposes only 
              and should not be considered professional career counseling, medical advice, or psychological diagnosis. We do not 
              guarantee specific outcomes from using our assessments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Privacy & Data Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your privacy is important to us. Our collection and use of personal information is governed by our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>. 
              By using the Service, you consent to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
              WE DO NOT WARRANT THAT:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>Results will be accurate, reliable, or complete</li>
              <li>Any defects will be corrected</li>
              <li>The Service is free from viruses or harmful components</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROLE COLOR FINDER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR 
              INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, 
              without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, 
              or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or 
              prominent notice on the Service. Continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Connecticut, United States, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 glass-card rounded-lg p-6">
              <p className="text-foreground"><strong>Role Color Finder</strong></p>
              <p className="text-muted-foreground">Email: legal@rolecolorfinder.com</p>
              <p className="text-muted-foreground">Support: support@rolecolorfinder.com</p>
            </div>
          </section>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <aside className="rounded-lg border p-6 text-muted-foreground bg-muted/30">
            <p className="mb-2">
              <strong className="text-foreground">Need Help?</strong>
            </p>
            <p>
              Visit our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> or{" "}
              <Link to="/contact" className="text-primary hover:underline">Contact Us</Link> for support.
            </p>
          </aside>
        </article>
      </main>
    </div>
  );
};

export default TermsOfService;
