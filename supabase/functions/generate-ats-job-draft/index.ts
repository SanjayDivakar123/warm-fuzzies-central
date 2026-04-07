import {
  corsHeaders,
  isHttpError,
  json,
  requireCompanyAccess,
} from "../_shared/merge.ts";

interface GenerateAtsJobDraftRequest {
  orgId?: string;
  targetPlatform?: string;
  job?: {
    title?: string;
    department?: string;
    description?: string;
    location?: string;
    remotePolicy?: string;
    employmentType?: string;
    requiredExperienceYears?: number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    requiredSkills?: string[];
    idealRoleColorPrimary?: string | null;
    idealRoleColorSecondary?: string | null;
  };
}

interface DraftResponse {
  title: string;
  description: string;
  required_skills: string[];
  posting_notes: string[];
}

const formatCurrencyRange = (salaryMin?: number | null, salaryMax?: number | null) => {
  const format = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  if (typeof salaryMin === "number" && typeof salaryMax === "number") {
    return `${format(salaryMin)} - ${format(salaryMax)}`;
  }
  if (typeof salaryMin === "number") {
    return `${format(salaryMin)}+`;
  }
  if (typeof salaryMax === "number") {
    return `Up to ${format(salaryMax)}`;
  }
  return null;
};

const parseJsonResponse = (content: string) => {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const raw = jsonMatch?.[0] || content;
  return JSON.parse(raw) as DraftResponse;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as GenerateAtsJobDraftRequest;
    const orgId = body.orgId;
    const targetPlatform = body.targetPlatform?.trim();
    const job = body.job || {};

    if (!orgId || !targetPlatform) {
      return json({ error: "orgId and targetPlatform are required" }, 400);
    }
    if (!job.title?.trim()) {
      return json({ error: "job.title is required" }, 400);
    }

    const context = await requireCompanyAccess(req, orgId);
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return json({ error: "OPENAI_API_KEY is not configured" }, 500);
    }

    const salaryRange = formatCurrencyRange(job.salaryMin, job.salaryMax);
    const userPrompt = `
Company: ${context.company.name}
Target ATS: ${targetPlatform}

Draft a job post tailored for the conventions of ${targetPlatform}. The company will publish it manually in that ATS after reviewing it in RoleColorFinder.

Job details:
- Title: ${job.title}
- Department: ${job.department || "Not provided"}
- Location: ${job.location || "Not provided"}
- Remote policy: ${job.remotePolicy || "Not provided"}
- Employment type: ${job.employmentType || "Not provided"}
- Required experience: ${job.requiredExperienceYears ?? "Not provided"} years
- Salary range: ${salaryRange || "Not provided"}
- Required skills: ${(job.requiredSkills || []).join(", ") || "Not provided"}
- Ideal RoleColors: ${[job.idealRoleColorPrimary, job.idealRoleColorSecondary].filter(Boolean).join(", ") || "Not provided"}
- Existing description/context: ${job.description || "None yet"}

Requirements:
- Optimize for readability, scannability, and strong ATS parsing.
- Use plain text headings and bullets, no markdown tables.
- Keep tone professional, modern, and inclusive.
- Include sections for overview, responsibilities, qualifications, and compensation/location when relevant.
- Tailor structure and wording to fit ${targetPlatform}'s common job-post style.
- Avoid fake benefits or legal claims not provided in the input.
- Improve title wording only if it becomes clearer for that ATS.

Return JSON only in this exact shape:
{
  "title": "string",
  "description": "string",
  "required_skills": ["string"],
  "posting_notes": ["string"]
}

The posting_notes array should contain 2-4 short reminders for manually publishing this draft in ${targetPlatform}.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert recruiting copywriter. You tailor job postings for specific ATS workflows and always return valid JSON only.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("generate-ats-job-draft OpenAI error", response.status, errorText);
      return json({ error: "AI service error" }, response.status === 429 ? 429 : 500);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return json({ error: "AI response was empty" }, 502);
    }

    const draft = parseJsonResponse(content);
    return json({
      success: true,
      draft: {
        title: draft.title?.trim() || job.title.trim(),
        description: draft.description?.trim() || job.description || "",
        required_skills: Array.isArray(draft.required_skills)
          ? draft.required_skills.filter((skill): skill is string => typeof skill === "string" && skill.trim().length > 0)
          : job.requiredSkills || [],
        posting_notes: Array.isArray(draft.posting_notes)
          ? draft.posting_notes.filter((note): note is string => typeof note === "string" && note.trim().length > 0)
          : [],
      },
    });
  } catch (error) {
    if (isHttpError(error)) {
      return json({ error: error.message }, error.status);
    }

    console.error("generate-ats-job-draft error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
