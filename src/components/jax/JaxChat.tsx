import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles, Loader2, Check, X, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  jaxChat,
  jaxScoreAllUnscored,
  jaxSetStatus,
  jaxDraftEmail,
} from "@/lib/jax-server";

type Role = "user" | "assistant";

interface ProposedAction {
  type: "score_all_unscored" | "set_status" | "draft_email";
  label?: string;
  leadId?: string;
  status?: string;
}

interface Message {
  role: Role;
  content: string;
  actions?: ProposedAction[];
  draft?: { to: string | null; subject: string; body: string } | null;
}

const INITIAL: Message = {
  role: "assistant",
  content:
    "Morning. I can see your leads and run actions for you. Try: *\"Score all unscored leads\"*, *\"Who are my best leads?\"*, or *\"Draft an intro email to the top one\"*.",
};

function parseActions(raw: string): { text: string; actions: ProposedAction[] } {
  const fence = /```actions\s*([\s\S]*?)```/i;
  const match = raw.match(fence);
  if (!match) return { text: raw, actions: [] };
  try {
    const parsed = JSON.parse(match[1].trim());
    const actions = Array.isArray(parsed) ? (parsed as ProposedAction[]) : [];
    return { text: raw.replace(fence, "").trim(), actions };
  } catch {
    return { text: raw, actions: [] };
  }
}

export function JaxChat({ tenantId }: { tenantId: string }) {
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatFn = useServerFn(jaxChat);
  const scoreAllFn = useServerFn(jaxScoreAllUnscored);
  const setStatusFn = useServerFn(jaxSetStatus);
  const draftFn = useServerFn(jaxDraftEmail);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const history: { role: Role; content: string }[] = [
      ...messages
        .filter((m) => m !== INITIAL || messages.length === 1)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    setMessages((cur) => [...cur, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatFn({ data: { tenantId, messages: history } });
      const { text: cleanText, actions } = parseActions(res.reply ?? "");
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: cleanText || "(no reply)", actions },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (msgIdx: number, actionIdx: number, action: ProposedAction) => {
    const key = `${msgIdx}-${actionIdx}`;
    setRunning(key);
    try {
      if (action.type === "score_all_unscored") {
        const r = await scoreAllFn({ data: { tenantId } });
        if (r.ok) {
          toast.success(`Scored ${r.scored} lead${r.scored === 1 ? "" : "s"}`);
          appendAssistant(`✅ Scored ${r.scored} lead${r.scored === 1 ? "" : "s"}.`);
        } else {
          toast.error(r.error ?? "Failed");
        }
      } else if (action.type === "set_status" && action.leadId && action.status) {
        const r = await setStatusFn({
          data: { leadId: action.leadId, status: action.status as never },
        });
        if (r.ok) {
          toast.success(`Status updated to ${action.status}`);
          appendAssistant(`✅ Status set to **${action.status}**.`);
        } else {
          toast.error(r.error ?? "Failed");
        }
      } else if (action.type === "draft_email" && action.leadId) {
        const r = await draftFn({ data: { leadId: action.leadId } });
        if (r.ok && r.draft) {
          setMessages((cur) => [
            ...cur,
            {
              role: "assistant",
              content: "Here's a draft. Copy it or send via your email client.",
              draft: r.draft,
            },
          ]);
        } else {
          toast.error(r.error ?? "Failed to draft");
        }
      }
      // Mark action consumed
      setMessages((cur) =>
        cur.map((m, i) =>
          i === msgIdx
            ? { ...m, actions: m.actions?.filter((_, j) => j !== actionIdx) }
            : m
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setRunning(null);
    }
  };

  const appendAssistant = (content: string) =>
    setMessages((cur) => [...cur, { role: "assistant", content }]);

  const dismissAction = (msgIdx: number, actionIdx: number) => {
    setMessages((cur) =>
      cur.map((m, i) =>
        i === msgIdx
          ? { ...m, actions: m.actions?.filter((_, j) => j !== actionIdx) }
          : m
      )
    );
  };

  const placeholder = useMemo(
    () => 'Ask Jax anything about your leads…',
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card/40 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-sm font-semibold">Jax</div>
          <div className="text-[11px] text-muted-foreground">Chief of Staff · Groq</div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>

              {m.draft && (
                <div className="mt-3 rounded-lg border border-border bg-background/60 p-3 text-foreground">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    To
                  </div>
                  <div className="text-sm">{m.draft.to ?? "(no email)"}</div>
                  <div className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Subject
                  </div>
                  <div className="text-sm font-medium">{m.draft.subject}</div>
                  <div className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Body
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{m.draft.body}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Subject: ${m.draft!.subject}\n\n${m.draft!.body}`
                        );
                        toast.success("Copied to clipboard");
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    {m.draft.to && (
                      <a
                        href={`mailto:${m.draft.to}?subject=${encodeURIComponent(m.draft.subject)}&body=${encodeURIComponent(m.draft.body)}`}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                      >
                        <Mail className="h-3 w-3" /> Open in email
                      </a>
                    )}
                  </div>
                </div>
              )}

              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Proposed actions — confirm to run
                  </div>
                  {m.actions.map((a, j) => {
                    const key = `${idx}-${j}`;
                    const isRunning = running === key;
                    return (
                      <div
                        key={j}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/60 px-3 py-2"
                      >
                        <span className="text-xs text-foreground">
                          {a.label ?? a.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!!running}
                            onClick={() => runAction(idx, j, a)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isRunning ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Run
                          </button>
                          <button
                            type="button"
                            disabled={!!running}
                            onClick={() => dismissAction(idx, j)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> Jax is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-card/40 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
