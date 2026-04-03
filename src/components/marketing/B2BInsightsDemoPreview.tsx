import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
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

export function B2BInsightsDemoPreview() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const steps: { phase: 0 | 1 | 2 | 3; y: number; hold: number }[] = [
      { phase: 0, y: 0, hold: 2800 },
      { phase: 1, y: 0, hold: 2600 },
      { phase: 2, y: -200, hold: 3200 },
      { phase: 3, y: -520, hold: 3800 },
    ];
    let i = 0;
    let timers: number[] = [];
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const s = steps[i % steps.length];
      setPhase(s.phase);
      setScrollY(s.y);
      timers.push(
        window.setTimeout(() => {
          i += 1;
          run();
        }, s.hold)
      );
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0 lg:max-w-none">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center lg:text-left">
        Demo preview (illustrative)
      </p>
      <div className="rounded-xl border border-border bg-muted/40 p-2 shadow-md">
        {/* Browser chrome */}
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

        <div className="relative h-[min(420px,55vh)] sm:h-[460px] overflow-hidden rounded-b-lg bg-background">
          <AnimatePresence mode="wait">
            {phase === 0 ? (
              <motion.div
                key="assessments"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 p-3 sm:p-4 overflow-y-auto"
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                    <div>
                      <CardTitle className="text-base font-medium">Completed Assessments</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">6 team members completed</p>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    >
                      <Button
                        size="sm"
                        className="gap-1.5 text-white pointer-events-none shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${DEMO_PRIMARY}, ${DEMO_SECONDARY})`,
                        }}
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        Insights
                      </Button>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-md border border-border/60 divide-y divide-border/60 text-[11px]">
                      {["A. Chen", "Jordan Lee", "John Smith", "Sam Rivera", "Taylor Kim", "Morgan Patel"].map(
                        (name, idx) => (
                          <div
                            key={name}
                            className={cn(
                              "flex items-center justify-between px-2 py-2",
                              idx === 2 && "bg-primary/5"
                            )}
                          >
                            <span className={cn("truncate", idx === 2 ? "font-medium text-foreground" : "text-muted-foreground")}>
                              {name}
                            </span>
                            <Badge variant="secondary" className="text-[9px] shrink-0">
                              View
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                    <p className="mt-3 text-[10px] text-muted-foreground text-center">
                      Opens Team Leadership Insights (same as your live portal)
                    </p>
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
                <div className="shrink-0 border-b px-3 py-2.5 sm:px-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm sm:text-base font-semibold leading-tight">Team Leadership Insights</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        AI-powered analysis of your team&apos;s leadership styles and role alignment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <motion.div
                    className="px-3 sm:px-4 pb-8 space-y-4 will-change-transform"
                    animate={{ y: scrollY }}
                    transition={{ duration: phase === 1 ? 0.35 : 1.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card className="border-2 border-primary/20 shadow-sm">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Team Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                        <p>
                          Acme Labs shows strong execution under pressure with a mix of innovators and organizers. The
                          main friction point is decision speed when product and operations disagree on priorities.
                        </p>
                        <Separator />
                        <p className="font-medium text-foreground text-[11px] flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          Team Dynamics
                        </p>
                        <p>
                          Blues push vision; greens keep delivery reliable. Adding clearer ownership on cross-functional
                          initiatives would reduce thrash between roadmap and ops.
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-2">
                      <Card className="shadow-sm">
                        <CardHeader className="pb-1 pt-2 px-2">
                          <CardTitle className="text-[11px] text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Team Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-2 pb-2 pt-0">
                          <ul className="text-[10px] space-y-1 text-muted-foreground">
                            <li className="flex gap-1">
                              <span className="text-green-500">✓</span> Deep product thinking
                            </li>
                            <li className="flex gap-1">
                              <span className="text-green-500">✓</span> Reliable shipping cadence
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader className="pb-1 pt-2 px-2">
                          <CardTitle className="text-[11px] text-amber-700 flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" />
                            Growth Areas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-2 pb-2 pt-0">
                          <ul className="text-[10px] space-y-1 text-muted-foreground">
                            <li className="flex gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              Role overlap on roadmap calls
                            </li>
                            <li className="flex gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              Async decision bottlenecks
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-0.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        Individual Leadership Analysis
                      </h3>
                      <p className="text-[10px] text-muted-foreground mb-2">Click on a team member to see their detailed analysis</p>

                      <Card className={cn("overflow-hidden border shadow-sm", JOHN_BG)}>
                        <div
                          className="px-3 py-2 flex flex-wrap items-start justify-between gap-2 border-l-4"
                          style={{ borderLeftColor: JOHN_COLOR }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                              style={{ backgroundColor: JOHN_COLOR }}
                            >
                              J
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-semibold text-sm">John Smith</span>
                                <Badge className="text-[9px] border-0 h-5 px-1.5" style={{ backgroundColor: JOHN_COLOR, color: "white" }}>
                                  Innovator
                                </Badge>
                                <Badge variant="outline" className="text-[9px] h-5 px-1.5 gap-0.5">
                                  <Briefcase className="h-2.5 w-2.5" />
                                  Product Lead
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">john.smith@acmelabs.example</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-medium flex items-center gap-0.5">
                              <TrendingUp className="h-2.5 w-2.5" />
                              82% Match
                            </div>
                          </div>
                        </div>
                        <CardContent className="space-y-3 bg-background/80 pt-3 text-xs">
                          <div>
                            <p className="font-medium text-[11px] mb-1">Leadership-Role Match Analysis</p>
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                              John&apos;s innovator profile aligns well with discovery and narrative work. He may stall when
                              asked to own repetitive operational checklists; pairing him with a strong organizer on
                              releases keeps velocity high without burning him out.
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-[11px] mb-1">Leadership Style</p>
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                              Curious, future-oriented, and comfortable challenging assumptions in workshop settings.
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                              <p className="font-medium text-[10px] text-green-800 dark:text-green-300 mb-1">Key Strengths</p>
                              <ul className="text-[10px] text-green-700 dark:text-green-400 space-y-0.5">
                                <li>• Framing problems clearly</li>
                                <li>• Stakeholder storytelling</li>
                              </ul>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                              <p className="font-medium text-[10px] text-amber-800 dark:text-amber-300 mb-1">Development Areas</p>
                              <ul className="text-[10px] text-amber-700 dark:text-amber-400 space-y-0.5">
                                <li>• Saying no to scope creep</li>
                                <li>• Timeboxing deep work</li>
                              </ul>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40">
                            <p className="font-semibold text-[10px] mb-1 flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Match Analysis for Product Lead
                            </p>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-blue-700 dark:text-blue-400">82% Match</span>
                              <Badge className="bg-blue-600 text-white text-[9px] h-5">Good Fit</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Strong fit for strategy and customer narrative; delegate recurring ops reviews where possible.
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm mt-3">
                        <CardHeader className="pb-1 pt-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Strategic Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ol className="space-y-2 text-[11px] text-muted-foreground">
                            {[
                              "Clarify DRI for roadmap tradeoffs between product and ops.",
                              "Pair innovators with organizers on quarterly planning.",
                              "Re-run insights after your next two hires to refresh team dynamics.",
                            ].map((rec, i) => (
                              <li key={rec} className="flex gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium">
                                  {i + 1}
                                </span>
                                <span className="leading-snug pt-0.5">{rec}</span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </div>

                <div className="shrink-0 border-t bg-muted/30 px-3 py-2 flex justify-end">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] pointer-events-none">
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
