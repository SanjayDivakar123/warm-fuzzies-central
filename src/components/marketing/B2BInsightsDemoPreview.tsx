import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Mirrors default B2B portal branding when company colors are unset. */
const DEMO_PRIMARY = "#22c55e";
const DEMO_SECONDARY = "#16a34a";

const JOHN_COLOR = "#3B82F6";
const JOHN_BG = "bg-blue-50 dark:bg-blue-950/30";

type CursorState = {
  visible: boolean;
  x: number;
  y: number;
  clicking: boolean;
};

const INITIAL_CURSOR: CursorState = { visible: false, x: 72, y: 82, clicking: false };

function FakeCursor({ state }: { state: CursorState }) {
  return (
    <motion.div
      className="absolute z-40 pointer-events-none"
      initial={false}
      animate={{
        opacity: state.visible ? 1 : 0,
        left: `${state.x}%`,
        top: `${state.y}%`,
        scale: state.clicking ? 0.92 : 1,
      }}
      transition={{
        opacity: { duration: 0.2 },
        left: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
        top: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.12 },
      }}
      style={{ marginLeft: -4, marginTop: -2 }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-md" aria-hidden>
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .73-.6.39-.97l-12.5-13.5a.5.5 0 0 0-.82.38Z"
          fill="white"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

export function B2BInsightsDemoPreview({ dense = false }: { dense?: boolean }) {
  const [view, setView] = useState<"assessments" | "insights">("assessments");
  const [cursor, setCursor] = useState<CursorState>(INITIAL_CURSOR);
  const [johnExpanded, setJohnExpanded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scrollTransition, setScrollTransition] = useState<{ duration: number }>({ duration: 0.35 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const reportViewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const johnRowRef = useRef<HTMLDivElement>(null);
  const johnNameRef = useRef<HTMLSpanElement>(null);
  const runIdRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const measureMaxScroll = useCallback(() => {
    const vp = reportViewportRef.current;
    const inner = contentRef.current;
    if (!vp || !inner) return 0;
    // Measure against the actual report viewport so the footer close bar does not
    // steal the last lines of content.
    return Math.min(0, vp.clientHeight - inner.scrollHeight - 8);
  }, []);

  /** Scroll offset (≤0) so John’s row sits under the modal header for the name click. */
  const computeScrollToJohnRow = useCallback(() => {
    const vp = reportViewportRef.current;
    const row = johnRowRef.current;
    const inner = contentRef.current;
    if (!vp || !row || !inner) return 0;
    const vpRect = vp.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const wantTop = vpRect.top + 56;
    const delta = wantTop - rowRect.top;
    const maxY = Math.min(0, vp.clientHeight - inner.scrollHeight);
    return Math.max(maxY, Math.min(0, delta));
  }, []);

  const getCursorTargetForInsightsButton = useCallback(() => {
    const root = viewportRef.current;
    const button = root?.querySelector("[data-demo-insights-btn]");
    if (!root || !(button instanceof HTMLElement)) {
      return { x: 86, y: 26 };
    }

    const rootRect = root.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const x = ((buttonRect.left + buttonRect.width / 2 - rootRect.left) / rootRect.width) * 100;
    const y = ((buttonRect.top + buttonRect.height / 2 - rootRect.top) / rootRect.height) * 100;
    return { x, y };
  }, []);

  const getCursorTargetForJohnName = useCallback(() => {
    const root = viewportRef.current;
    const name = johnNameRef.current;
    if (!root || !name) {
      return { x: 35, y: 52 };
    }

    const rootRect = root.getBoundingClientRect();
    const nameRect = name.getBoundingClientRect();
    const x = ((nameRect.left + Math.min(nameRect.width * 0.45, 72) - rootRect.left) / rootRect.width) * 100;
    const y = ((nameRect.top + nameRect.height / 2 - rootRect.top) / rootRect.height) * 100;
    return { x, y };
  }, []);

  useLayoutEffect(() => {
    if (view !== "insights" || !johnExpanded) return;
    const id = requestAnimationFrame(() => {
      measureMaxScroll();
    });
    return () => cancelAnimationFrame(id);
  }, [view, johnExpanded, measureMaxScroll]);

  useEffect(() => {
    const id = ++runIdRef.current;
    timersRef.current = [];
    const cancelled = () => id !== runIdRef.current;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          timersRef.current = timersRef.current.filter((x) => x !== t);
          resolve();
        }, ms);
        timersRef.current.push(t);
      });

    const setC = (patch: Partial<CursorState>) => {
      setCursor((c) => ({ ...c, ...patch }));
    };

    async function sequence() {
      while (!cancelled()) {
        // ——— Assessments: cursor enters, moves to Insights, clicks ———
        setView("assessments");
        setJohnExpanded(false);
        setScrollY(0);
        setScrollTransition({ duration: 0 });
        setC({ visible: true, x: 68, y: 78, clicking: false });
        await wait(500);
        if (cancelled()) return;

        const insightsTarget = getCursorTargetForInsightsButton();
        setC({ x: insightsTarget.x, y: insightsTarget.y, clicking: false });
        await wait(950);
        if (cancelled()) return;

        setC({ clicking: true });
        await wait(140);
        if (cancelled()) return;
        setC({ clicking: false });
        await wait(220);
        if (cancelled()) return;

        setC({ visible: false });
        setView("insights");
        setJohnExpanded(false);
        setScrollY(0);
        setScrollTransition({ duration: 0.35 });
        await wait(1800);
        if (cancelled()) return;

        // ——— Scroll report so “John Smith” is in view (still collapsed) ———
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
        if (cancelled()) return;

        setScrollTransition({ duration: 1.55 });
        const toJohn = computeScrollToJohnRow();
        setScrollY(toJohn);
        await wait(1700);
        if (cancelled()) return;

        // ——— Cursor onto John Smith name, click to expand ———
        const johnTarget = getCursorTargetForJohnName();
        setC({ visible: true, x: johnTarget.x + 8, y: johnTarget.y - 6, clicking: false });
        await wait(500);
        if (cancelled()) return;

        setC({ x: johnTarget.x, y: johnTarget.y, clicking: false });
        await wait(750);
        if (cancelled()) return;

        setC({ clicking: true });
        await wait(130);
        if (cancelled()) return;
        setC({ clicking: false });
        setJohnExpanded(true);
        await wait(900);
        if (cancelled()) return;

        setC({ visible: false });

        // ——— Faster scroll through full report to the bottom ———
        await wait(420);
        if (cancelled()) return;

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        );
        if (cancelled()) return;

        const maxY = measureMaxScroll();

        const scrollDistance = Math.abs(maxY);
        if (scrollDistance > 24) {
          const dur = Math.max(5, Math.min(10.5, scrollDistance / 48));
          setScrollTransition({ duration: dur });
          setScrollY(maxY);
          await wait(dur * 1000 + 350);
        } else {
          await wait(900);
        }
        if (cancelled()) return;

        // Hold on last content, then restart
        await wait(1500);
        if (cancelled()) return;
      }
    }

    void sequence();

    return () => {
      runIdRef.current += 1;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [computeScrollToJohnRow, getCursorTargetForInsightsButton, getCursorTargetForJohnName, measureMaxScroll]);

  return (
    <div className="relative flex h-full w-full max-w-xl flex-col mx-auto lg:mx-0 lg:max-w-none">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center lg:text-left">
        Demo preview (illustrative)
      </p>
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-muted/40 p-2 shadow-md">
        <div className="flex items-center gap-2 rounded-t-lg bg-muted/80 px-3 py-2 border-b border-border">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground truncate border border-border/60">
            app.rolecolorfinder.com/b2b · Assessments
          </div>
        </div>

        <div
          ref={viewportRef}
          className={cn(
            "relative flex-1 min-h-0 overflow-hidden rounded-b-lg bg-background",
            dense ? "h-[min(260px,36vh)] sm:h-full" : "h-[min(440px,58vh)] sm:h-[500px]"
          )}
        >
          <FakeCursor state={cursor} />

          <AnimatePresence mode="wait">
            {view === "assessments" ? (
              <motion.div
                key="assessments"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 p-4 sm:p-5 overflow-y-auto"
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0 gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-medium">Completed Assessments</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1.5">6 team members completed</p>
                    </div>
                    <div data-demo-insights-btn className="shrink-0">
                      <Button
                        size="sm"
                        className={cn(
                          "gap-1.5 text-white pointer-events-none shadow-md transition-transform",
                          cursor.clicking && cursor.visible && "scale-[0.97] ring-2 ring-white/70 ring-offset-2 ring-offset-background",
                          cursor.visible && "relative z-10"
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${DEMO_PRIMARY}, ${DEMO_SECONDARY})`,
                        }}
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        Insights
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-md border border-border/60 divide-y divide-border/60 text-[11px]">
                      {["A. Chen", "Jordan Lee", "John Smith", "Sam Rivera", "Taylor Kim", "Morgan Patel"].map(
                        (name, idx) => (
                          <div
                            key={name}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5",
                              idx === 2 && "bg-primary/5"
                            )}
                          >
                            <span
                              className={cn(
                                "truncate",
                                idx === 2 ? "font-medium text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {name}
                            </span>
                            <Badge variant="secondary" className="text-[9px] shrink-0">
                              View
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="insights-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col bg-background"
              >
                <div className="shrink-0 border-b px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-base font-semibold leading-tight">Team Leadership Insights</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        AI-powered analysis of your team&apos;s leadership styles and role alignment
                      </p>
                    </div>
                  </div>
                </div>

                <div ref={reportViewportRef} className="flex-1 min-h-0 overflow-hidden relative">
                  <motion.div
                    ref={contentRef}
                    className="px-4 sm:px-5 pb-10 space-y-5 sm:space-y-6 will-change-transform"
                    animate={{ y: scrollY }}
                    transition={{
                      duration: scrollTransition.duration,
                      ease: scrollTransition.duration > 2 ? [0.25, 0.1, 0.25, 1] : [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Card className="border-2 border-primary/20 shadow-sm">
                      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          Team Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 px-4 sm:px-5 pb-5">
                        <p>
                          Acme Labs shows strong execution under pressure with a mix of innovators and organizers. The
                          main friction point is decision speed when product and operations disagree on priorities.
                        </p>
                        <Separator />
                        <p className="font-medium text-foreground text-xs sm:text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary shrink-0" />
                          Team Dynamics
                        </p>
                        <p>
                          Blues push vision; greens keep delivery reliable. Adding clearer ownership on cross-functional
                          initiatives would reduce thrash between roadmap and ops.
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                          <CardTitle className="text-xs sm:text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Team Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-4 pb-4 pt-0">
                          <ul className="text-[11px] sm:text-xs space-y-2 text-muted-foreground leading-snug">
                            <li className="flex gap-2">
                              <span className="text-green-500 shrink-0">✓</span> Deep product thinking
                            </li>
                            <li className="flex gap-2">
                              <span className="text-green-500 shrink-0">✓</span> Reliable shipping cadence
                            </li>
                            <li className="flex gap-2">
                              <span className="text-green-500 shrink-0">✓</span> Strong cross-team communication in crises
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                          <CardTitle className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Target className="h-4 w-4 shrink-0" />
                            Growth Areas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-4 pb-4 pt-0">
                          <ul className="text-[11px] sm:text-xs space-y-2 text-muted-foreground leading-snug">
                            <li className="flex gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              Role overlap on roadmap calls
                            </li>
                            <li className="flex gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              Async decision bottlenecks
                            </li>
                            <li className="flex gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              Unclear DRI on experiments
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Individual Leadership Analysis
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5">
                          Click on a team member to see their detailed analysis
                        </p>
                      </div>

                      <Card className={cn("overflow-hidden border shadow-sm", JOHN_BG)}>
                        <div
                          ref={johnRowRef}
                          className={cn(
                            "px-3 sm:px-4 py-3 flex flex-wrap items-start justify-between gap-2 border-l-4 cursor-default transition-[colors,box-shadow]",
                            johnExpanded ? "" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                            cursor.clicking &&
                              cursor.visible &&
                              view === "insights" &&
                              "ring-2 ring-primary/40 ring-inset"
                          )}
                          style={{ borderLeftColor: JOHN_COLOR }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                              style={{ backgroundColor: JOHN_COLOR }}
                            >
                              J
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span ref={johnNameRef} className="font-semibold text-sm">John Smith</span>
                                <Badge
                                  className="text-[9px] border-0 h-5 px-1.5"
                                  style={{ backgroundColor: JOHN_COLOR, color: "white" }}
                                >
                                  Innovator
                                </Badge>
                                <Badge variant="outline" className="text-[9px] h-5 px-1.5 gap-0.5">
                                  <Briefcase className="h-2.5 w-2.5" />
                                  Product Lead
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                john.smith@acmelabs.example
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-medium flex items-center gap-0.5">
                              <TrendingUp className="h-2.5 w-2.5" />
                              82% Match
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                johnExpanded && "rotate-180"
                              )}
                            />
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {johnExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <CardContent className="space-y-4 bg-background/80 pt-4 pb-5 text-xs border-t border-border/40 px-3 sm:px-4">
                                <div>
                                  <p className="font-medium text-xs sm:text-sm mb-1.5">Leadership-Role Match Analysis</p>
                                  <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                                    John&apos;s innovator profile aligns well with discovery and narrative work. He may stall when
                                    asked to own repetitive operational checklists; pairing him with a strong organizer on
                                    releases keeps velocity high without burning him out.
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-xs sm:text-sm mb-1.5">Leadership Style</p>
                                  <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                                    Curious, future-oriented, and comfortable challenging assumptions in workshop settings.
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-xs sm:text-sm mb-1.5">Workplace Contribution</p>
                                  <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                                    Reframes ambiguous asks into testable bets and brings customer language into roadmap
                                    conversations.
                                  </p>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                                    <p className="font-medium text-xs text-green-800 dark:text-green-300 mb-2">Key Strengths</p>
                                    <ul className="text-[11px] text-green-700 dark:text-green-400 space-y-1.5 leading-snug">
                                      <li>• Framing problems clearly</li>
                                      <li>• Stakeholder storytelling</li>
                                      <li>• Spotting second-order product risks early</li>
                                    </ul>
                                  </div>
                                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                                    <p className="font-medium text-xs text-amber-800 dark:text-amber-300 mb-2">Development Areas</p>
                                    <ul className="text-[11px] text-amber-700 dark:text-amber-400 space-y-1.5 leading-snug">
                                      <li>• Saying no to scope creep</li>
                                      <li>• Timeboxing deep work</li>
                                      <li>• Handing off execution without hovering</li>
                                    </ul>
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                  <p className="font-medium text-xs sm:text-sm mb-1.5">Potential Challenges</p>
                                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                                    May disengage when meetings repeat without decisions; needs visible progress markers on
                                    longer initiatives.
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                                  <p className="font-medium text-xs sm:text-sm text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    Actionable Advice
                                  </p>
                                  <p className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                    Give John the first draft of narrative and metrics; assign a partner to own the
                                    checklist-heavy release steps each sprint.
                                  </p>
                                </div>
                                <div className="p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40">
                                  <p className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Match Analysis for Product Lead
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="text-xl font-bold text-blue-700 dark:text-blue-400">82% Match</span>
                                    <Badge className="bg-blue-600 text-white text-[10px] h-6">Good Fit</Badge>
                                  </div>
                                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                                    Strong fit for strategy and customer narrative; delegate recurring ops reviews where possible.
                                  </p>
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            Strategic Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-6">
                          <ol className="space-y-3 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                            {[
                              "Clarify DRI for roadmap tradeoffs between product and ops.",
                              "Pair innovators with organizers on quarterly planning.",
                              "Re-run insights after your next two hires to refresh team dynamics.",
                              "Publish a simple RACI for experiments so async updates do not stall decisions.",
                            ].map((rec, i) => (
                              <li key={rec} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-medium">
                                  {i + 1}
                                </span>
                                <span className="pt-0.5">{rec}</span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </div>

                <div className="shrink-0 border-t bg-muted/30 px-4 py-2.5 flex justify-end">
                  <Button variant="outline" size="sm" className="h-8 text-xs pointer-events-none">
                    Close
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
