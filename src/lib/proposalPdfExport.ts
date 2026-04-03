import jsPDF from "jspdf";
import type { ProposalPricing } from "@/pages/admin/ProposalManager";

/* ─────────────────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────────────────── */

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Wrap text and return lines */
function splitLines(pdf: jsPDF, text: string, maxWidth: number): string[] {
  return pdf.splitTextToSize(text, maxWidth);
}

/** Add a footer on the current page */
function addFooter(pdf: jsPDF, pageNum: number, totalPages: number, docTitle: string) {
  const y = PAGE_H - 9;
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, y - 3, PAGE_W - MARGIN, y - 3);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(150, 150, 150);
  pdf.text("RoleColorFinder LLC  ·  Confidential", MARGIN, y);
  pdf.text(docTitle, PAGE_W / 2, y, { align: "center" });
  pdf.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, y, { align: "right" });
}

/** Draw a dark header band at the top of the page */
function addPageHeader(pdf: jsPDF, docType: string, proposalId: string) {
  pdf.setFillColor(15, 23, 42); // slate-950
  pdf.rect(0, 0, PAGE_W, 22, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text("ROLECOLORFINDER", MARGIN, 9);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 200, 140);
  pdf.text(docType.toUpperCase(), MARGIN, 15);

  pdf.setTextColor(150, 150, 150);
  pdf.text(proposalId, PAGE_W - MARGIN, 15, { align: "right" });
}

/** Y-position tracker that auto-adds pages */
class Cursor {
  y: number;
  pdf: jsPDF;
  pageNum: number;
  pageCount: number;
  docType: string;
  proposalId: string;

  constructor(pdf: jsPDF, docType: string, proposalId: string) {
    this.pdf = pdf;
    this.y = 34;
    this.pageNum = 1;
    this.pageCount = 1; // updated after render
    this.docType = docType;
    this.proposalId = proposalId;
  }

  ensureSpace(needed: number) {
    if (this.y + needed > PAGE_H - 20) {
      this.pdf.addPage();
      this.pageNum++;
      addPageHeader(this.pdf, this.docType, this.proposalId);
      this.y = 34;
    }
  }

  skip(mm: number) { this.y += mm; }

  /** Horizontal rule */
  rule(color = [220, 220, 220] as [number, number, number]) {
    this.ensureSpace(4);
    this.pdf.setDrawColor(...color);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 4;
  }

  /** Section heading */
  heading(text: string, level: 1 | 2 = 1) {
    const size = level === 1 ? 11 : 9.5;
    const gap = level === 1 ? 6 : 4;
    this.ensureSpace(gap + 6);
    if (level === 1) {
      this.pdf.setFillColor(241, 245, 249); // slate-100
      this.pdf.rect(MARGIN - 2, this.y - 3, CONTENT_W + 4, 8, "F");
      this.pdf.setDrawColor(99, 102, 241); // indigo-500
      this.pdf.setLineWidth(0.8);
      this.pdf.line(MARGIN - 2, this.y - 3, MARGIN - 2, this.y + 5);
    }
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(size);
    this.pdf.setTextColor(15, 23, 42);
    this.pdf.text(text, MARGIN + (level === 1 ? 2 : 0), this.y + 2.5);
    this.y += gap + 2;
  }

  /** Body paragraph */
  body(text: string, indent = 0) {
    const lines = splitLines(this.pdf, text, CONTENT_W - indent);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(51, 65, 85); // slate-700
    for (const line of lines) {
      this.ensureSpace(5);
      this.pdf.text(line, MARGIN + indent, this.y);
      this.y += 4.8;
    }
    this.y += 1.5;
  }

  /** Bullet point */
  bullet(text: string, indent = 4) {
    const maxW = CONTENT_W - indent - 4;
    const lines = splitLines(this.pdf, text, maxW);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(51, 65, 85);
    this.ensureSpace(5);
    this.pdf.text("•", MARGIN + indent, this.y);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) this.ensureSpace(5);
      this.pdf.text(lines[i], MARGIN + indent + 4, this.y);
      this.y += 4.8;
    }
    this.y += 0.8;
  }

  /** Numbered list item */
  numbered(num: string, text: string, indent = 4) {
    const maxW = CONTENT_W - indent - 8;
    const lines = splitLines(this.pdf, text, maxW);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(51, 65, 85);
    this.ensureSpace(5);
    this.pdf.text(num, MARGIN + indent, this.y);
    this.pdf.setFont("helvetica", "normal");
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) this.ensureSpace(5);
      this.pdf.text(lines[i], MARGIN + indent + 8, this.y);
      this.y += 4.8;
    }
    this.y += 0.8;
  }

  /** Pricing row (label + value side by side) */
  pricingRow(label: string, value: string, shade = false) {
    this.ensureSpace(8);
    if (shade) {
      this.pdf.setFillColor(248, 250, 252);
      this.pdf.rect(MARGIN, this.y - 3, CONTENT_W, 7, "F");
    }
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(71, 85, 105);
    this.pdf.text(label, MARGIN + 2, this.y + 1);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(15, 23, 42);
    this.pdf.text(value, PAGE_W - MARGIN - 2, this.y + 1, { align: "right" });
    this.y += 7;
  }
}

/* ─────────────────────────────────────────────────────────────
   Title Page block (first page hero)
───────────────────────────────────────────────────────────── */

function drawTitleBlock(
  pdf: jsPDF,
  docType: "LETTER OF INTENT" | "LETTER OF ENGAGEMENT",
  companyName: string,
  proposalId: string,
  dateStr: string,
  cur: Cursor
) {
  // Large dark hero block
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, PAGE_W, 68, "F");

  // Accent strip
  pdf.setFillColor(16, 185, 129); // emerald-500
  pdf.rect(0, 68, PAGE_W, 1.5, "F");

  // RCF wordmark
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("ROLECOLORFINDER", MARGIN, 22);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 200, 140);
  pdf.text("ROLE INTELLIGENCE & TEAM PERFORMANCE PLATFORM", MARGIN, 29);

  // Doc type
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text(docType, MARGIN, 48);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(`Prepared for: ${companyName}`, MARGIN, 58);
  pdf.text(`${proposalId}  ·  ${dateStr}`, PAGE_W - MARGIN, 58, { align: "right" });

  cur.y = 82;

  // Info grid
  const col1 = MARGIN;
  const col2 = PAGE_W / 2 + 4;
  const infoY = cur.y;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text("BETWEEN", col1, infoY);
  pdf.text("AND", col2, infoY);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(companyName, col1, infoY + 6);
  pdf.text("RoleColorFinder LLC", col2, infoY + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('"Client"', col1, infoY + 12);
  pdf.text('"RCF"  ·  Greenwich, CT, USA', col2, infoY + 12);

  cur.y = infoY + 20;
  cur.rule();
}

/* ─────────────────────────────────────────────────────────────
   Pricing section (shared between LOI and LOE)
───────────────────────────────────────────────────────────── */

function drawPricingSection(pdf: jsPDF, pricing: ProposalPricing, cur: Cursor) {
  cur.ensureSpace(70);

  // Section background
  pdf.setFillColor(240, 253, 244); // green-50
  pdf.setDrawColor(167, 243, 208); // green-200
  pdf.setLineWidth(0.4);
  const boxY = cur.y - 4;
  const boxH = 72;
  pdf.roundedRect(MARGIN - 2, boxY, CONTENT_W + 4, boxH, 2, 2, "FD");

  // Header row
  pdf.setFillColor(16, 185, 129);
  pdf.rect(MARGIN - 2, boxY, CONTENT_W + 4, 9, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text("INVESTMENT SUMMARY", MARGIN + 2, boxY + 6);
  pdf.text("Valid for 12 months from date of signing", PAGE_W - MARGIN - 2, boxY + 6, { align: "right" });

  cur.y = boxY + 14;

  // One-time header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(6, 78, 59);
  pdf.text("ONE-TIME FEES", MARGIN + 2, cur.y);
  cur.y += 5;

  cur.pricingRow("Platform Deployment Fee", pricing.platformDeployment, false);
  cur.pricingRow("Employee Onboarding (per employee)", pricing.employeeOnboarding, true);

  // Divider
  pdf.setDrawColor(167, 243, 208);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, cur.y, PAGE_W - MARGIN, cur.y);
  cur.y += 5;

  // Monthly header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(6, 78, 59);
  pdf.text("MONTHLY RECURRING", MARGIN + 2, cur.y);
  cur.y += 5;

  cur.pricingRow("Core Platform Access", pricing.corePlatformMonthly, false);
  cur.pricingRow("Hiring Intelligence Platform", pricing.hiringIntelligenceMonthly, true);
  cur.pricingRow(
    `Includes ${pricing.includedJobRoles} active roles  ·  ${pricing.applicantsPerRole} applicants/role`,
    "Included",
    false
  );
  cur.pricingRow(`Scaling — ${pricing.scalingNote}`, pricing.scalingPrice, true);
  cur.pricingRow("Outcome-Based — per successful hire", pricing.outcomePrice, false);

  cur.y = boxY + boxH + 4;
}

/* ─────────────────────────────────────────────────────────────
   Signature block
───────────────────────────────────────────────────────────── */

function drawSignatureBlock(
  pdf: jsPDF,
  signedName: string,
  signedAt: string,
  companyName: string,
  docType: string,
  cur: Cursor
) {
  cur.ensureSpace(52);

  const boxY = cur.y;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN - 2, boxY, CONTENT_W + 4, 48, 2, 2, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text("ELECTRONIC SIGNATURE", MARGIN + 2, boxY + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `By signing below, the undersigned confirms they have read, understood, and agreed to this ${docType}.`,
    MARGIN + 2,
    boxY + 15,
  );

  // Signed name in italic / script style
  pdf.setFont("times", "italic");
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.text(signedName, MARGIN + 2, boxY + 30);

  pdf.setDrawColor(100, 116, 139);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN + 2, boxY + 33, PAGE_W / 2 - 10, boxY + 33);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Authorised Signatory", MARGIN + 2, boxY + 38);
  pdf.text(companyName, MARGIN + 2, boxY + 43);

  // RCF side
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text("RoleColorFinder LLC", PAGE_W / 2 + 4, boxY + 30);

  pdf.setDrawColor(100, 116, 139);
  pdf.line(PAGE_W / 2 + 4, boxY + 33, PAGE_W - MARGIN - 2, boxY + 33);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Authorised Signatory", PAGE_W / 2 + 4, boxY + 38);
  pdf.text("Greenwich, CT, USA", PAGE_W / 2 + 4, boxY + 43);

  // Timestamp
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  cur.y = boxY + 50;
  pdf.text(
    `Electronically signed on ${signedAt}  ·  This document constitutes a legally binding electronic signature.`,
    PAGE_W / 2,
    cur.y,
    { align: "center" }
  );
  cur.y += 6;
}

/* ─────────────────────────────────────────────────────────────
   EXPORT: generateLOI
───────────────────────────────────────────────────────────── */

export function generateLOIPdf(
  companyName: string,
  proposalId: string,
  pricing: ProposalPricing,
  signedName: string,
  signedAt: string
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const cur = new Cursor(pdf, "LETTER OF INTENT", proposalId);

  drawTitleBlock(pdf, "LETTER OF INTENT", companyName, proposalId, dateStr, cur);

  // RECITALS
  cur.heading("RECITALS");
  cur.body(
    `This Letter of Intent ("LOI") is submitted by ${companyName} ("Client") to RoleColorFinder LLC ("RCF"), ` +
    `a Florida-based role intelligence and talent management technology company. This document reflects the ` +
    `Client's sincere and good-faith intent to enter into a formal engagement with RCF for the deployment ` +
    `of the RoleColorFinder platform as described in Proposal ${proposalId}.`
  );
  cur.body(
    `RCF has developed a proprietary platform that enables organisations to identify individual work styles, ` +
    `align teams for optimal performance, make data-driven hiring decisions, and build scalable execution ` +
    `cultures. The Client recognises the strategic value of this platform in addressing its current ` +
    `organisational challenges and achieving measurable performance improvements.`
  );
  cur.body(
    `Both parties acknowledge that this LOI is intended to initiate formal engagement proceedings and does ` +
    `not, except where expressly stated, create binding legal obligations on either party.`
  );

  cur.rule();

  // Article 1
  cur.heading("ARTICLE 1 — STATEMENT OF INTENT");
  cur.body(
    `1.1  ${companyName} hereby expresses its clear and unconditional intent to engage RoleColorFinder LLC ` +
    `as its strategic partner for the implementation, deployment, and ongoing operation of the ` +
    `RoleColorFinder platform across its organisation.`
  );
  cur.body(
    `1.2  This intent encompasses the full scope of services described in Proposal ${proposalId}, including ` +
    `but not limited to platform deployment, employee onboarding and assessment, team intelligence reporting, ` +
    `hiring intelligence tools, and ongoing platform access.`
  );
  cur.body(
    `1.3  The Client confirms that the appropriate internal approvals and stakeholder authorisations have ` +
    `been obtained, or are in the process of being obtained, to enter into a formal engagement with RCF.`
  );
  cur.body(
    `1.4  The Client further confirms that it is not party to any agreement or obligation that would ` +
    `prevent, limit, or restrict its ability to engage RCF for the services described herein.`
  );

  cur.rule();

  // Article 2
  cur.heading("ARTICLE 2 — SCOPE OF INTENDED ENGAGEMENT");
  cur.body("2.1  The intended scope of engagement includes the following core service areas:");
  cur.bullet(
    `Role Intelligence & Team Assessment: Deployment of the RoleColorFinder assessment platform to all ` +
    `enrolled employees, generating individual RoleColor profiles that identify each person's natural work ` +
    `style, contribution mode, and team compatibility.`
  );
  cur.bullet(
    `Team Alignment & Performance Optimisation: Organisation-wide team mapping and gap analysis to identify ` +
    `structural misalignments, communication inefficiencies, and execution blockers across departments and ` +
    `management levels.`
  );
  cur.bullet(
    `Hiring Intelligence: Integration of RCF's hiring intelligence module into the Client's recruitment ` +
    `workflows, including role-fit scoring, candidate profiling, interview question generation, and ` +
    `post-hire outcome tracking.`
  );
  cur.bullet(
    `Platform Administration & Reporting: Access to the RCF administrative dashboard, including real-time ` +
    `team insights, analytics reporting, individual development plans, and leadership performance metrics.`
  );
  cur.bullet(
    `Dedicated Onboarding & Implementation Support: A dedicated RCF implementation specialist will ` +
    `oversee platform configuration, employee onboarding sessions, manager training, and initial ` +
    `performance benchmarking.`
  );
  cur.body(
    `2.2  The precise scope, deliverable schedule, and integration requirements will be formally defined ` +
    `in the Letter of Engagement to be executed by both parties following payment of the platform ` +
    `deployment fee.`
  );

  cur.rule();

  // Article 3 — Pricing
  cur.heading("ARTICLE 3 — KEY FINANCIAL TERMS");
  cur.body(
    `3.1  The Client acknowledges and accepts the investment structure outlined in Proposal ${proposalId}. ` +
    `The following summary represents the agreed financial framework and is valid for a period of ` +
    `twelve (12) months from the date of this Letter of Intent.`
  );
  cur.skip(2);
  drawPricingSection(pdf, pricing, cur);

  cur.body(
    `3.2  The Platform Deployment Fee of ${pricing.platformDeployment} is a one-time, non-refundable ` +
    `investment that covers full platform setup, configuration, and the first deployment milestone. ` +
    `This fee is payable in full upon execution of the Letter of Engagement.`
  );
  cur.body(
    `3.3  Monthly recurring fees will be invoiced on the first business day of each calendar month, ` +
    `commencing thirty (30) days after the completion of platform deployment. All invoices are payable ` +
    `within fifteen (15) days of issuance.`
  );
  cur.body(
    `3.4  Employee onboarding fees are calculated per enrolled employee and are payable as employees ` +
    `are onboarded to the platform. RCF will provide a detailed onboarding schedule prior to commencement.`
  );

  cur.rule();

  // Article 4
  cur.heading("ARTICLE 4 — PROPOSED IMPLEMENTATION TIMELINE");
  cur.body(
    `4.1  Subject to the timely completion of the platform deployment payment and execution of the ` +
    `Letter of Engagement, both parties intend to adhere to the following implementation timeline:`
  );
  cur.numbered("Day 1–2:", "Platform deployment fee received; account provisioning initiated by RCF team.");
  cur.numbered("Day 3–7:", "Platform configuration completed; administrative access granted to Client's designated contact.");
  cur.numbered("Week 2–3:", "Employee assessment invitations distributed; initial RoleColor profiling completed.");
  cur.numbered("Week 4–5:", "Team intelligence reports generated; initial team alignment sessions conducted.");
  cur.numbered("Month 2:", "Hiring intelligence module activated; full platform operational across all departments.");
  cur.numbered("Month 3:", "First performance review and optimisation session; scaling plan reviewed.");
  cur.body(
    `4.2  RCF acknowledges that timeline adjustments may be required based on the Client's internal ` +
    `scheduling, employee availability, and IT infrastructure considerations. RCF will work ` +
    `collaboratively with the Client to minimise delays.`
  );

  cur.rule();

  // Article 5
  cur.heading("ARTICLE 5 — EXCLUSIVITY AND RESERVATION");
  cur.body(
    `5.1  Upon signing this Letter of Intent and completing the platform deployment payment, RCF will ` +
    `reserve an exclusive onboarding slot for ${companyName} and will not offer the same deployment ` +
    `window to a competing organisation in the same industry sector and geographical market.`
  );
  cur.body(
    `5.2  This exclusivity applies solely to the onboarding scheduling and does not restrict RCF from ` +
    `continuing to serve existing clients or engaging new clients in other sectors or regions.`
  );
  cur.body(
    `5.3  In the event that the Client does not complete the platform deployment payment within ` +
    `fourteen (14) days of signing this LOI, the reserved onboarding slot will be released and ` +
    `this exclusivity commitment will be void.`
  );

  cur.rule();

  // Article 6
  cur.heading("ARTICLE 6 — NON-BINDING NATURE");
  cur.body(
    `6.1  Except for the provisions contained in Article 7 (Confidentiality), this Letter of Intent ` +
    `is non-binding and does not obligate either party to complete the contemplated engagement. ` +
    `Neither party shall have any legal recourse against the other solely on the basis of this LOI ` +
    `if the engagement does not proceed.`
  );
  cur.body(
    `6.2  Binding obligations will arise only upon the execution of the Letter of Engagement ` +
    `and payment of the platform deployment fee.`
  );

  cur.rule();

  // Article 7
  cur.heading("ARTICLE 7 — CONFIDENTIALITY");
  cur.body(
    `7.1  Both parties agree to maintain strict confidentiality regarding the existence and terms ` +
    `of this LOI and all related proposal documentation. Neither party shall disclose the contents ` +
    `of this LOI to any third party without the prior written consent of the other party.`
  );
  cur.body(
    `7.2  "Confidential Information" means all non-public information disclosed by either party ` +
    `in connection with the contemplated engagement, including but not limited to pricing, ` +
    `methodology, technology, client data, and strategic plans.`
  );
  cur.body(
    `7.3  The confidentiality obligations contained in this Article 7 are binding and shall ` +
    `survive the termination or expiration of this LOI for a period of three (3) years.`
  );

  cur.rule();

  // Article 8
  cur.heading("ARTICLE 8 — GOVERNING LAW");
  cur.body(
    `8.1  This Letter of Intent shall be governed by and construed in accordance with the laws ` +
    `of the State of Florida, United States, without regard to conflict of law principles.`
  );
  cur.body(
    `8.2  Any disputes arising from or in connection with this LOI shall be submitted to ` +
    `binding arbitration administered by the American Arbitration Association in Miami, Florida.`
  );

  cur.rule();

  // Article 9
  cur.heading("ARTICLE 9 — EXPIRATION");
  cur.body(
    `9.1  This Letter of Intent shall remain open for acceptance for a period of thirty (30) ` +
    `calendar days from the date of issuance. In the event the Client does not sign and return ` +
    `this LOI within this period, the proposal terms and any pricing commitments contained herein ` +
    `will be subject to review and may be revised by RCF.`
  );
  cur.body(
    `9.2  This LOI may be executed electronically. An electronic signature shall be deemed ` +
    `legally valid and binding under applicable law.`
  );

  cur.rule();

  drawSignatureBlock(pdf, signedName, signedAt, companyName, "Letter of Intent", cur);

  // Footers
  const total = pdf.getNumberOfPages();
  addPageHeader(pdf, "LETTER OF INTENT", proposalId); // already on p1
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, total, `LOI — ${proposalId}`);
  }

  pdf.save(`RCF-LOI-${proposalId}.pdf`);
}

/* ─────────────────────────────────────────────────────────────
   EXPORT: generateLOE
───────────────────────────────────────────────────────────── */

export function generateLOEPdf(
  companyName: string,
  proposalId: string,
  pricing: ProposalPricing,
  signedName: string,
  signedAt: string
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const cur = new Cursor(pdf, "LETTER OF ENGAGEMENT", proposalId);

  drawTitleBlock(pdf, "LETTER OF ENGAGEMENT", companyName, proposalId, dateStr, cur);

  // Preamble
  cur.heading("PREAMBLE");
  cur.body(
    `This Letter of Engagement ("Agreement") is entered into as of ${dateStr} by and between ` +
    `RoleColorFinder LLC, a limited liability company incorporated in the State of Florida, USA ` +
    `("RCF" or "Service Provider"), and ${companyName} ("Client"). This Agreement governs ` +
    `the terms under which RCF will provide its role intelligence and talent performance platform ` +
    `services to the Client.`
  );
  cur.body(
    `This Agreement, together with Proposal ${proposalId}, constitutes the entire understanding ` +
    `between the parties with respect to the services described herein, and supersedes all prior ` +
    `negotiations, representations, and letters of intent.`
  );

  cur.rule();

  // Article 1 — Definitions
  cur.heading("ARTICLE 1 — DEFINITIONS");
  cur.body('In this Agreement, the following terms have the meanings assigned to them below:');
  cur.bullet(
    `"Platform" means the RoleColorFinder software platform, including all modules, tools, ` +
    `dashboards, assessment engines, reporting systems, and related intellectual property owned by RCF.`
  );
  cur.bullet(
    `"Services" means the full scope of services to be provided by RCF as described in Article 2, ` +
    `including Platform Deployment, Employee Onboarding, Core Platform Access, and Hiring Intelligence.`
  );
  cur.bullet(
    `"Authorised Users" means the Client's employees, contractors, and designated personnel who ` +
    `are granted access to the Platform under this Agreement.`
  );
  cur.bullet(
    `"Client Data" means all data, information, and content uploaded to or generated through the ` +
    `Platform by the Client or its Authorised Users.`
  );
  cur.bullet(
    `"Confidential Information" means all non-public information disclosed by either party that ` +
    `is marked as confidential or that a reasonable person would consider confidential given its nature.`
  );
  cur.bullet(
    `"Deployment Date" means the date on which the Platform is fully configured and access is ` +
    `granted to the Client's administrators, as confirmed in writing by RCF.`
  );
  cur.bullet(
    `"Subscription Term" means the initial twelve (12) month period commencing on the Deployment ` +
    `Date, and each subsequent renewal term unless terminated in accordance with Article 12.`
  );

  cur.rule();

  // Article 2 — Services
  cur.heading("ARTICLE 2 — SCOPE OF SERVICES");
  cur.body(
    `2.1  Platform Deployment.  RCF will configure the Platform for the Client's organisation, ` +
    `including custom branding, organisational structure setup, role mapping, and system integration ` +
    `with the Client's existing HR tools (where applicable). Deployment will be completed within ` +
    `five (5) to seven (7) business days of payment confirmation.`
  );
  cur.body(
    `2.2  Employee Onboarding.  RCF will provide a structured onboarding process for all enrolled ` +
    `employees, including digital assessment invitations, guided completion workflows, and automated ` +
    `RoleColor profile generation. Onboarding is charged on a per-employee basis at the rate specified ` +
    `in Article 4.`
  );
  cur.body(
    `2.3  Core Platform Access.  The Client will receive full access to the RCF Core Platform, ` +
    `including: (a) individual and team RoleColor dashboards; (b) team alignment and gap analysis ` +
    `reports; (c) execution optimisation tools; (d) manager and leadership development modules; ` +
    `(e) cross-team collaboration insights; and (f) export and PDF reporting tools.`
  );
  cur.body(
    `2.4  Hiring Intelligence.  The Client will receive access to the Hiring Intelligence module, ` +
    `including: (a) role-fit assessment for candidates; (b) automated interview question generation ` +
    `aligned to role requirements; (c) candidate RoleColor profiling and fit scoring; ` +
    `(d) comparative analysis of candidates against existing team profiles; and (e) post-hire ` +
    `outcome tracking. This module supports up to ${pricing.includedJobRoles} active job roles ` +
    `and up to ${pricing.applicantsPerRole} applicants per role.`
  );
  cur.body(
    `2.5  Account Support.  RCF will provide dedicated account support via email during business ` +
    `hours (Monday to Friday, 9:00 AM to 5:00 PM EST), with a committed response time of one ` +
    `(1) business day. Critical issues will be escalated to the engineering team within four (4) hours.`
  );
  cur.body(
    `2.6  Platform Updates.  RCF will provide ongoing platform updates, feature releases, and ` +
    `security patches at no additional cost during the Subscription Term. Major feature releases ` +
    `will be communicated to the Client at least five (5) business days in advance.`
  );

  cur.rule();

  // Article 3 — Deliverables
  cur.heading("ARTICLE 3 — DELIVERABLES AND MILESTONES");
  cur.body("3.1  RCF commits to delivering the following milestones:");
  cur.numbered("M1:", "Account provisioned and administrative access granted within 1–2 business days of payment.");
  cur.numbered("M2:", "Platform fully configured with Client's branding and organisational structure within 7 business days.");
  cur.numbered("M3:", "Employee assessment invitations deployed within 10 business days of account provisioning.");
  cur.numbered("M4:", "Initial RoleColor profiles generated for all assessed employees within 3 days of assessment completion.");
  cur.numbered("M5:", "First team alignment report and insights dashboard delivered within 21 days of Deployment Date.");
  cur.numbered("M6:", "Hiring Intelligence module activated and integrated within 30 days of Deployment Date.");
  cur.numbered("M7:", "First quarterly performance and optimisation review conducted within 90 days of Deployment Date.");
  cur.body(
    `3.2  Milestone completion will be confirmed in writing via email to the Client's designated ` +
    `contact. Delays caused by the Client's failure to provide required information, access, or ` +
    `approvals will not constitute a breach by RCF.`
  );

  cur.rule();

  // Article 4 — Fees
  cur.heading("ARTICLE 4 — FEES, PAYMENT TERMS & INVESTMENT STRUCTURE");
  cur.body(
    `4.1  The full investment structure applicable to this engagement is set forth below and is ` +
    `valid for twelve (12) months from the date of this Agreement:`
  );
  cur.skip(2);
  drawPricingSection(pdf, pricing, cur);

  cur.body(
    `4.2  Platform Deployment Fee.  The one-time Platform Deployment Fee of ${pricing.platformDeployment} ` +
    `is payable in full prior to the commencement of any services. This fee is non-refundable once ` +
    `deployment has commenced and covers full platform setup, configuration, and implementation support.`
  );
  cur.body(
    `4.3  Employee Onboarding Fee.  The per-employee onboarding fee of ${pricing.employeeOnboarding} ` +
    `will be invoiced as employees are onboarded. RCF will provide a detailed onboarding schedule ` +
    `at least five (5) business days prior to each onboarding cohort.`
  );
  cur.body(
    `4.4  Monthly Subscription Fees.  Monthly fees will be invoiced on the first business day of ` +
    `each calendar month, commencing thirty (30) days following the Deployment Date. Invoices are ` +
    `payable within fifteen (15) calendar days. Late payments will accrue interest at a rate of ` +
    `1.5% per month on the outstanding balance.`
  );
  cur.body(
    `4.5  Scaling Fees.  In the event the Client requires active job roles beyond the included ` +
    `${pricing.includedJobRoles}, an additional scaling fee of ${pricing.scalingPrice} ` +
    `${pricing.scalingNote} will apply, invoiced monthly alongside regular subscription fees.`
  );
  cur.body(
    `4.6  Outcome-Based Fees.  An outcome-based fee of ${pricing.outcomePrice} will be invoiced ` +
    `for each verified successful hire made through the Hiring Intelligence module. ` +
    `${pricing.outcomeNote}  RCF will provide a monthly report of tracked hires for the Client's review.`
  );
  cur.body(
    `4.7  All fees are denominated in United States Dollars (USD) and are exclusive of any ` +
    `applicable taxes, levies, or duties, which shall be the sole responsibility of the Client.`
  );
  cur.body(
    `4.8  RCF reserves the right to review and adjust fee schedules at annual renewal with a ` +
    `minimum of sixty (60) days' written notice. The Client may terminate within this notice ` +
    `period without penalty if fee adjustments are not acceptable.`
  );

  cur.rule();

  // Article 5
  cur.heading("ARTICLE 5 — CLIENT OBLIGATIONS");
  cur.body(`5.1  To enable RCF to deliver the Services effectively, the Client agrees to:`);
  cur.bullet(
    `Designate a primary point of contact ("Client Administrator") who will liaise with RCF ` +
    `throughout the engagement and have authority to make operational decisions.`
  );
  cur.bullet(
    `Provide timely access to all organisational information, HR data, and system credentials ` +
    `reasonably required by RCF to configure the Platform.`
  );
  cur.bullet(
    `Ensure employee participation in onboarding and assessment sessions in accordance with the ` +
    `agreed schedule.`
  );
  cur.bullet(
    `Promptly review and approve Platform configurations, reports, and deliverables within five ` +
    `(5) business days of receipt.`
  );
  cur.bullet(
    `Not resell, sublicense, or otherwise grant access to the Platform to any third party without ` +
    `RCF's prior written consent.`
  );
  cur.bullet(
    `Ensure that all Authorised Users comply with RCF's acceptable use policy and applicable law.`
  );

  cur.rule();

  // Article 6
  cur.heading("ARTICLE 6 — INTELLECTUAL PROPERTY");
  cur.body(
    `6.1  RCF Intellectual Property.  All rights, title, and interest in and to the Platform, ` +
    `including all software, algorithms, methodologies, frameworks, content, and documentation, ` +
    `remain the exclusive property of RoleColorFinder LLC. Nothing in this Agreement transfers ` +
    `any ownership rights in RCF's intellectual property to the Client.`
  );
  cur.body(
    `6.2  Client Data.  All Client Data remains the exclusive property of the Client. RCF is ` +
    `granted a limited, non-exclusive licence to process Client Data solely for the purpose of ` +
    `delivering the Services. RCF will not use Client Data for any other purpose without ` +
    `the Client's express written consent.`
  );
  cur.body(
    `6.3  Output Rights.  Reports, profiles, and analyses generated through the Platform using ` +
    `the Client's data are owned by the Client. RCF retains the right to use anonymised, ` +
    `aggregated data for platform improvement and research purposes.`
  );

  cur.rule();

  // Article 7
  cur.heading("ARTICLE 7 — DATA PROTECTION AND PRIVACY");
  cur.body(
    `7.1  Both parties agree to comply with all applicable data protection laws and regulations ` +
    `in their respective jurisdictions, including but not limited to GDPR (where applicable), ` +
    `CCPA, and applicable US federal and state privacy laws.`
  );
  cur.body(
    `7.2  RCF will implement and maintain appropriate technical and organisational measures to ` +
    `protect Client Data against unauthorised access, alteration, disclosure, or destruction, ` +
    `including encryption at rest and in transit, role-based access controls, and regular ` +
    `security audits.`
  );
  cur.body(
    `7.3  RCF will notify the Client within seventy-two (72) hours of becoming aware of any ` +
    `confirmed data breach that affects Client Data.`
  );
  cur.body(
    `7.4  Upon termination of this Agreement, RCF will make all Client Data available for export ` +
    `in a standard format for a period of thirty (30) days, after which it will be securely ` +
    `deleted from RCF's systems.`
  );

  cur.rule();

  // Article 8
  cur.heading("ARTICLE 8 — CONFIDENTIALITY AND NON-DISCLOSURE");
  cur.body(
    `8.1  Each party agrees to maintain the confidentiality of the other party's Confidential ` +
    `Information and not to disclose such information to any third party without prior written ` +
    `consent, except as required by law or court order.`
  );
  cur.body(
    `8.2  Confidential Information does not include information that: (a) is or becomes publicly ` +
    `available through no fault of the receiving party; (b) was rightfully known to the receiving ` +
    `party prior to disclosure; (c) is independently developed by the receiving party without ` +
    `reference to the disclosing party's Confidential Information.`
  );
  cur.body(
    `8.3  The confidentiality obligations contained in this Article 8 survive the termination ` +
    `or expiration of this Agreement for a period of three (3) years.`
  );

  cur.rule();

  // Article 9
  cur.heading("ARTICLE 9 — REPRESENTATIONS AND WARRANTIES");
  cur.body("9.1  RCF represents and warrants that:");
  cur.bullet("It has full legal authority to enter into this Agreement and perform the Services.");
  cur.bullet(
    "The Platform will perform materially in accordance with the documentation and specifications " +
    "provided to the Client."
  );
  cur.bullet(
    "RCF will perform the Services in a professional, workmanlike manner consistent with ` +` " +
    "industry standards."
  );
  cur.bullet(
    "The Platform does not infringe any third-party intellectual property rights known to RCF."
  );
  cur.body("9.2  The Client represents and warrants that:");
  cur.bullet("It has full legal authority to enter into this Agreement.");
  cur.bullet(
    "It has obtained all necessary consents for RCF to process employee data as required " +
    "to deliver the Services."
  );
  cur.bullet(
    "The use of the Platform by the Client and its Authorised Users will comply with all " +
    "applicable laws and regulations."
  );

  cur.rule();

  // Article 10
  cur.heading("ARTICLE 10 — LIMITATION OF LIABILITY");
  cur.body(
    `10.1  To the maximum extent permitted by applicable law, neither party shall be liable to ` +
    `the other for any indirect, incidental, special, consequential, or punitive damages, ` +
    `including loss of profits, loss of data, or business interruption, arising out of or ` +
    `related to this Agreement, even if advised of the possibility of such damages.`
  );
  cur.body(
    `10.2  RCF's total cumulative liability arising out of or related to this Agreement shall ` +
    `not exceed the total fees paid by the Client to RCF in the three (3) calendar months ` +
    `immediately preceding the event giving rise to the claim.`
  );
  cur.body(
    `10.3  The limitations in this Article 10 shall not apply to: (a) death or personal injury ` +
    `caused by negligence; (b) fraud or fraudulent misrepresentation; (c) any liability that ` +
    `cannot be excluded by law.`
  );

  cur.rule();

  // Article 11
  cur.heading("ARTICLE 11 — INDEMNIFICATION");
  cur.body(
    `11.1  Client Indemnification.  The Client agrees to indemnify, defend, and hold harmless ` +
    `RCF and its officers, directors, employees, and agents from and against any claims, damages, ` +
    `losses, or expenses (including reasonable legal fees) arising out of: (a) the Client's breach ` +
    `of this Agreement; (b) the Client's use of the Platform in violation of applicable law; or ` +
    `(c) the Client's failure to obtain required consents for employee data processing.`
  );
  cur.body(
    `11.2  RCF Indemnification.  RCF agrees to indemnify, defend, and hold harmless the Client ` +
    `from and against any third-party claims alleging that the Platform infringes a third party's ` +
    `intellectual property rights, provided that the Client promptly notifies RCF of such claim ` +
    `and cooperates in the defence.`
  );

  cur.rule();

  // Article 12
  cur.heading("ARTICLE 12 — TERM AND TERMINATION");
  cur.body(
    `12.1  Term.  This Agreement commences on the Deployment Date and continues for the initial ` +
    `Subscription Term of twelve (12) months. Following the initial term, this Agreement will ` +
    `automatically renew for successive twelve (12) month periods unless either party provides ` +
    `written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.`
  );
  cur.body(
    `12.2  Termination for Convenience.  Either party may terminate the monthly Services with ` +
    `thirty (30) days' written notice. The one-time Platform Deployment Fee is non-refundable.`
  );
  cur.body(
    `12.3  Termination for Cause.  Either party may terminate this Agreement immediately upon ` +
    `written notice if the other party: (a) materially breaches this Agreement and fails to ` +
    `remedy the breach within fifteen (15) days of written notice; (b) becomes insolvent, ` +
    `makes an assignment for the benefit of creditors, or enters bankruptcy proceedings.`
  );
  cur.body(
    `12.4  Effects of Termination.  Upon termination: (a) all licences granted under this ` +
    `Agreement immediately cease; (b) Client access to the Platform is deactivated; (c) RCF will ` +
    `make Client Data available for export for thirty (30) days; (d) accrued payment obligations ` +
    `remain due and payable.`
  );

  cur.rule();

  // Article 13
  cur.heading("ARTICLE 13 — FORCE MAJEURE");
  cur.body(
    `13.1  Neither party shall be liable for any delay or failure to perform its obligations ` +
    `under this Agreement to the extent such delay or failure is caused by circumstances beyond ` +
    `that party's reasonable control, including acts of God, natural disasters, war, terrorism, ` +
    `government action, pandemic, or infrastructure failure ("Force Majeure Event").`
  );
  cur.body(
    `13.2  The affected party must notify the other party promptly of the Force Majeure Event ` +
    `and resume performance as soon as reasonably possible. If the Force Majeure Event continues ` +
    `for more than sixty (60) days, either party may terminate this Agreement without penalty.`
  );

  cur.rule();

  // Article 14
  cur.heading("ARTICLE 14 — GENERAL PROVISIONS");
  cur.body(
    `14.1  Governing Law.  This Agreement is governed by the laws of the State of Florida, ` +
    `United States, without regard to conflict of law principles.`
  );
  cur.body(
    `14.2  Dispute Resolution.  Any dispute arising from or in connection with this Agreement ` +
    `shall be resolved by binding arbitration administered by the American Arbitration Association ` +
    `in Miami, Florida. The prevailing party shall be entitled to recover reasonable legal fees.`
  );
  cur.body(
    `14.3  Amendments.  This Agreement may only be amended by a written instrument signed by ` +
    `authorised representatives of both parties.`
  );
  cur.body(
    `14.4  Severability.  If any provision of this Agreement is found to be unenforceable, ` +
    `that provision will be modified to the minimum extent necessary to make it enforceable, ` +
    `and the remaining provisions will continue in full force and effect.`
  );
  cur.body(
    `14.5  Waiver.  No failure or delay by either party in exercising any right under this ` +
    `Agreement shall operate as a waiver of that right.`
  );
  cur.body(
    `14.6  Assignment.  The Client may not assign or transfer this Agreement or any rights ` +
    `hereunder without RCF's prior written consent. RCF may assign this Agreement to an ` +
    `affiliate or in connection with a merger, acquisition, or sale of substantially all assets.`
  );
  cur.body(
    `14.7  Notices.  All notices must be in writing and sent by email with read receipt or ` +
    `by courier to the addresses provided by each party's designated contact. Notices are ` +
    `effective upon confirmed receipt.`
  );
  cur.body(
    `14.8  Entire Agreement.  This Agreement, together with Proposal ${proposalId}, constitutes ` +
    `the entire agreement between the parties regarding the subject matter hereof and supersedes ` +
    `all prior agreements, negotiations, and representations.`
  );
  cur.body(
    `14.9  Electronic Execution.  This Agreement may be executed electronically. An electronic ` +
    `signature shall be deemed legally valid and binding.`
  );
  cur.body(
    `14.10  Counterparts.  This Agreement may be executed in counterparts, each of which shall ` +
    `be deemed an original, and all of which together shall constitute one and the same instrument.`
  );

  cur.rule();

  drawSignatureBlock(pdf, signedName, signedAt, companyName, "Letter of Engagement", cur);

  // Footers
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    addFooter(pdf, i, total, `LOE — ${proposalId}`);
  }

  pdf.save(`RCF-LOE-${proposalId}.pdf`);
}
