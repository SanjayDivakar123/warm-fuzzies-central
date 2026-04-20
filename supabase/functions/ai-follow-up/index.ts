import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const OFF_TOPIC_RESPONSE =
  "We aren't able to answer that question here. Please contact support@rolecolorfinder.com.";

const SHORT_FOLLOW_UP_PATTERNS = [
  /^why[?.! ]*$/i,
  /^how so[?.! ]*$/i,
  /^what else[?.! ]*$/i,
  /^which one[?.! ]*$/i,
  /^who specifically[?.! ]*$/i,
  /^tell me more[?.! ]*$/i,
  /^explain more[?.! ]*$/i,
  /^expand on that[?.! ]*$/i,
  /^can you expand(?: on that)?[?.! ]*$/i,
  /^can you elaborate(?: on that)?[?.! ]*$/i,
  /^what do you mean[?.! ]*$/i,
  /^based on what[?.! ]*$/i,
];

const SHARED_KEYWORDS = [
  "rolecolor",
  "role color",
  "assessment",
  "assessments",
  "color",
  "colours",
  "yellow",
  "red",
  "green",
  "blue",
  "executor",
  "motivator",
  "organizer",
  "innovator",
  "leadership",
  "leader",
  "leaders",
  "manager",
  "management",
  "strength",
  "strengths",
  "weakness",
  "weaknesses",
  "concern",
  "concerns",
  "recommendation",
  "recommendations",
];

const CONTEXT_KEYWORDS: Record<"candidate-fit" | "team-insights", string[]> = {
  "candidate-fit": [
    "candidate",
    "interview",
    "interviews",
    "hire",
    "hiring",
    "fit",
    "role fit",
    "red flag",
    "red flags",
    "job",
    "position",
    "onboard",
    "lead",
    "leadership potential",
  ],
  "team-insights": [
    "team",
    "roles",
    "missing roles",
    "collaboration",
    "conflict",
    "communication",
    "workload",
    "ownership",
    "delegation",
    "team dynamics",
    "optimize",
    "optimization",
    "manager",
    "lead",
    "morale",
  ],
};

const STOP_WORDS = new Set([
  "a", "about", "after", "again", "all", "also", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "being", "between", "both", "but", "by", "can", "could",
  "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further",
  "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself",
  "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
  "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or",
  "other", "our", "ours", "ourselves", "out", "over", "own", "please", "same", "she", "should",
  "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "will", "with", "would", "you", "your", "yours", "yourself", "yourselves",
]);

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function collectContextStrings(value: unknown, collector: string[], seen = new Set<unknown>()) {
  if (value == null || collector.length >= 80 || seen.has(value)) {
    return;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      collector.push(trimmed);
    }
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      collectContextStrings(item, collector, seen);
      if (collector.length >= 80) {
        return;
      }
    }
    return;
  }

  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    collectContextStrings(nestedValue, collector, seen);
    if (collector.length >= 80) {
      return;
    }
  }
}

function extractContextTokens(contextData: unknown): Set<string> {
  const strings: string[] = [];
  collectContextStrings(contextData, strings);

  return new Set(
    strings
      .flatMap((value) => tokenize(value))
      .filter((token) => token.length >= 4 || token === "hr"),
  );
}

function isFollowUpQuestionAllowed(
  contextType: "candidate-fit" | "team-insights",
  question: string,
  contextData: unknown,
  messages: Message[],
): boolean {
  if (messages.some((message) => message.role === "assistant") && SHORT_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(question.trim()))) {
    return true;
  }

  const normalizedQuestion = normalizeText(question);
  const keywordMatchCount = [...SHARED_KEYWORDS, ...CONTEXT_KEYWORDS[contextType]].reduce(
    (count, keyword) => (normalizedQuestion.includes(keyword) ? count + 1 : count),
    0,
  );

  if (keywordMatchCount > 0) {
    return true;
  }

  const questionTokens = new Set(tokenize(question));
  const contextTokens = extractContextTokens(contextData);
  return [...questionTokens].some((token) => contextTokens.has(token));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contextType, context, messages, question } = await req.json();

    if (!contextType || !context || !question) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contextType, context, question" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const priorMessages = Array.isArray(messages) ? messages : [];
    if (!isFollowUpQuestionAllowed(contextType, question, context, priorMessages)) {
      return new Response(
        JSON.stringify({ answer: OFF_TOPIC_RESPONSE, rejected: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt based on context type
    let systemPrompt = "";
    
    if (contextType === "candidate-fit") {
      systemPrompt = `You are an expert hiring analyst helping evaluate a job candidate. You have access to the candidate's RoleColor assessment results and AI-generated fit analysis.

CANDIDATE CONTEXT:
${JSON.stringify(context, null, 2)}

RoleColor Framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive
- Red (Motivator): Inspiring, people-focused, enthusiastic, relationship-builders
- Green (Organizer): Structured, detail-oriented, reliable, systematic
- Blue (Innovator): Creative, visionary, strategic, big-picture thinkers

IMPORTANT LEADERSHIP INSIGHT: The best leaders have Red and/or Yellow as their PRIMARY or SECONDARY colors. Candidates with Red+Yellow combinations or Red/Yellow as their secondary color have HIGH leadership potential. If neither Red nor Yellow is in their top two colors, their leadership potential is LIMITED - this is critical for management/leadership roles.

Answer only questions that are directly about this candidate, their RoleColor results, or hiring guidance grounded in the provided context.
If the user asks something unrelated, reply exactly with: "${OFF_TOPIC_RESPONSE}"
Keep answers concise.
Formatting rules:
- Use the same normal body-text tone throughout
- Do not use markdown headings
- Use short paragraphs or short bullet lists only when helpful
- Bold is okay for short labels, but avoid large formatted sections
- Keep the answer focused on practical next steps`;
    } else if (contextType === "team-insights") {
      systemPrompt = `You are an expert organizational psychologist and leadership consultant. You have access to a team's RoleColor assessment results and AI-generated team insights.

TEAM CONTEXT:
${JSON.stringify(context, null, 2)}

RoleColor Framework:
- Yellow (Executor): Action-oriented, results-driven, decisive, competitive
- Red (Motivator): Inspiring, people-focused, enthusiastic, relationship-builders
- Green (Organizer): Structured, detail-oriented, reliable, systematic
- Blue (Innovator): Creative, visionary, strategic, big-picture thinkers

IMPORTANT LEADERSHIP INSIGHT: The best leaders have Red and/or Yellow as their PRIMARY or SECONDARY colors. Team members with Red+Yellow combinations or Red/Yellow as their secondary color have HIGH leadership potential. Those without Red or Yellow in their top two colors have LIMITED leadership potential and may not be suited for leadership roles.

Answer only questions that are directly about this team, their RoleColor results, or team optimization guidance grounded in the provided context.
If the user asks something unrelated, reply exactly with: "${OFF_TOPIC_RESPONSE}"
Keep answers concise.
Formatting rules:
- Use the same normal body-text tone throughout
- Do not use markdown headings
- Use short paragraphs or short bullet lists only when helpful
- Bold is okay for short labels, but avoid large formatted sections
- Keep the answer focused on practical next steps`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid contextType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation history
    const conversationMessages: Message[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add previous messages if any
    if (priorMessages.length > 0) {
      for (const msg of priorMessages) {
        conversationMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current question
    conversationMessages.push({ role: "user", content: question });

    console.log(`Processing ${contextType} follow-up question:`, question);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully generated follow-up response");

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-follow-up:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
