// Parse pasted text (CSV with headers, or one-per-line) into draft leads.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface DraftLead {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  website: string | null;
  linkedin_url: string | null;
}

export interface ParseResult {
  leads: DraftLead[];
  skipped: number;
}

export function parsePastedLeads(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { leads: [], skipped: 0 };

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { leads: [], skipped: 0 };

  // Detect CSV: first line has commas or tabs AND looks like headers
  const first = lines[0];
  const hasDelim = /,|\t/.test(first);
  const looksLikeHeader = hasDelim && /email|name|company|title/i.test(first);

  if (looksLikeHeader) return parseCsv(lines);
  return parseSimple(lines);
}

function parseSimple(lines: string[]): ParseResult {
  const leads: DraftLead[] = [];
  let skipped = 0;
  for (const line of lines) {
    const value = line.trim();
    if (!value) continue;
    // line could be "Name <email@x.com>" or just an email
    const emailMatch = value.match(/[^\s<>,;]+@[^\s<>,;]+/);
    if (!emailMatch) {
      skipped++;
      continue;
    }
    const email = emailMatch[0].toLowerCase();
    const namePart = value.replace(emailMatch[0], "").replace(/[<>,;]/g, "").trim();
    const [first_name = null, ...rest] = namePart ? namePart.split(/\s+/) : [];
    leads.push({
      email,
      first_name: first_name || null,
      last_name: rest.length ? rest.join(" ") : null,
      company: null,
      title: null,
      website: null,
      linkedin_url: null,
    });
  }
  return dedupe(leads, skipped);
}

function parseCsv(lines: string[]): ParseResult {
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const headers = splitCsvLine(lines[0], delim).map((h) => h.trim().toLowerCase());
  const idx = (...names: string[]) =>
    names.map((n) => headers.indexOf(n)).find((i) => i >= 0) ?? -1;

  const emailI = idx("email", "email address", "e-mail");
  const firstI = idx("first_name", "firstname", "first name");
  const lastI = idx("last_name", "lastname", "last name");
  const fullI = idx("name", "full name");
  const companyI = idx("company", "organization", "org");
  const titleI = idx("title", "job title", "role");
  const websiteI = idx("website", "url", "domain");
  const linkedinI = idx("linkedin", "linkedin_url", "linkedin url");

  const leads: DraftLead[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delim);
    const rawEmail = emailI >= 0 ? cells[emailI]?.trim() : "";
    if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
      skipped++;
      continue;
    }
    let first = firstI >= 0 ? cells[firstI]?.trim() || null : null;
    let last = lastI >= 0 ? cells[lastI]?.trim() || null : null;
    if (!first && !last && fullI >= 0) {
      const full = cells[fullI]?.trim() ?? "";
      const parts = full.split(/\s+/);
      first = parts[0] || null;
      last = parts.slice(1).join(" ") || null;
    }
    leads.push({
      email: rawEmail.toLowerCase(),
      first_name: first,
      last_name: last,
      company: companyI >= 0 ? cells[companyI]?.trim() || null : null,
      title: titleI >= 0 ? cells[titleI]?.trim() || null : null,
      website: websiteI >= 0 ? cells[websiteI]?.trim() || null : null,
      linkedin_url: linkedinI >= 0 ? cells[linkedinI]?.trim() || null : null,
    });
  }
  return dedupe(leads, skipped);
}

function splitCsvLine(line: string, delim: string): string[] {
  // Lightweight CSV split with quote support
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function dedupe(leads: DraftLead[], priorSkipped: number): ParseResult {
  const seen = new Set<string>();
  const out: DraftLead[] = [];
  let skipped = priorSkipped;
  for (const l of leads) {
    if (!l.email) {
      skipped++;
      continue;
    }
    if (seen.has(l.email)) {
      skipped++;
      continue;
    }
    seen.add(l.email);
    out.push(l);
  }
  return { leads: out, skipped };
}
