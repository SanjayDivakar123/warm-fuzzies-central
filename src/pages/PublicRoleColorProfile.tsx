import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const isPublicProfilesUnavailableError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();

  return (
    message.includes("public_profiles") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("permission") ||
    message.includes("rls") ||
    details.includes("public_profiles") ||
    details.includes("relation") ||
    code === "pgrst205" ||
    code === "42p01"
  );
};

const probePublicProfilesAvailability = async () => {
  try {
    const { error } = await (supabase as any)
      .from("public_profiles")
      .select("id")
      .limit(1);

    if (error && isPublicProfilesUnavailableError(error)) {
      return false;
    }

    return true;
  } catch (error) {
    return !isPublicProfilesUnavailableError(error);
  }
};

const roleMeta: Record<string, { emoji: string; title: string; teamRole: string; leadership: string; strengths: string[] }> = {
  red: {
    emoji: "🔴",
    title: "Motivator",
    teamRole: "Energy Catalyst",
    leadership: "You ignite people and move them toward action.",
    strengths: ["Inspires momentum", "Builds team excitement", "Communicates vision", "Drives engagement"],
  },
  yellow: {
    emoji: "🟡",
    title: "Executor",
    teamRole: "Results Driver",
    leadership: "You create momentum and push teams to finish strong.",
    strengths: ["Fast decision making", "Execution focus", "Goal ownership", "Crisis response"],
  },
  green: {
    emoji: "🟢",
    title: "Strategist",
    teamRole: "Systems Architect",
    leadership: "You build clarity, structure, and long-term team stability.",
    strengths: ["Systems thinking", "Analytical planning", "Process quality", "Risk awareness"],
  },
  blue: {
    emoji: "🔵",
    title: "Visionary",
    teamRole: "Future Builder",
    leadership: "You spot possibilities early and inspire creative direction.",
    strengths: ["Big-picture thinking", "Innovation mindset", "Creative strategy", "Opportunity sensing"],
  },
};

const themeClass: Record<string, string> = {
  classic: "from-primary/10 via-background to-background",
  midnight: "from-slate-900/70 via-slate-950/70 to-background",
  sunset: "from-orange-500/10 via-rose-500/10 to-background",
};

const formatKeyLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());

const renderReportValue = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <p className="text-sm whitespace-pre-wrap">{String(value)}</p>;
  }

  return (
    <pre className="text-xs bg-muted/40 rounded-md p-3 overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};

const colorBarClass: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
};

export default function PublicRoleColorProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [person, setPerson] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        let socialProfile: any = null;
        let publicProfilesAvailable = localStorage.getItem("public_profiles_available") !== "false";
        if (!publicProfilesAvailable) {
          publicProfilesAvailable = await probePublicProfilesAvailability();
          localStorage.setItem("public_profiles_available", publicProfilesAvailable ? "true" : "false");
        }

        if (publicProfilesAvailable) {
          const { data, error } = await (supabase as any)
            .from("public_profiles")
            .select("*")
            .eq("username", username.toLowerCase())
            .eq("is_public", true)
            .maybeSingle();

          if (error) {
            if (isPublicProfilesUnavailableError(error)) {
              localStorage.setItem("public_profiles_available", "false");
            } else {
              throw error;
            }
          } else {
            socialProfile = data;
            localStorage.setItem("public_profiles_available", "true");
          }
        }

        if (!socialProfile) {
          const cachedRaw = localStorage.getItem(`public_profile_${username.toLowerCase()}`);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached?.is_public) {
              setProfile({
                username: cached.username,
                theme: cached.theme || "classic",
                profile_image_url: cached.profile_image_url || null,
                view_count: cached.view_count || 0,
              });
              setPerson(cached.person || null);
              setAssessment(cached.assessment || null);
              setLoading(false);
              return;
            }
          }

          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(socialProfile);

        const { data: basicProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", socialProfile.user_id)
          .maybeSingle();

        setPerson(basicProfile || null);

        let selectedAssessment = null;
        if (socialProfile.selected_assessment_result_id) {
          const { data } = await supabase
            .from("assessment_results")
            .select("*")
            .eq("id", socialProfile.selected_assessment_result_id)
            .eq("user_id", socialProfile.user_id)
            .maybeSingle();
          selectedAssessment = data;
        }

        if (!selectedAssessment) {
          const { data } = await supabase
            .from("assessment_results")
            .select("*")
            .eq("user_id", socialProfile.user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          selectedAssessment = data;
        }

        setAssessment(selectedAssessment);

        if (localStorage.getItem("public_profiles_available") !== "false") {
          const { error: viewCountError } = await (supabase as any)
            .from("public_profiles")
            .update({ view_count: (socialProfile.view_count || 0) + 1 })
            .eq("id", socialProfile.id);

          if (viewCountError && isPublicProfilesUnavailableError(viewCountError)) {
            localStorage.setItem("public_profiles_available", "false");
          }
        }
      } catch (error) {
        if (!isPublicProfilesUnavailableError(error)) {
          console.error("Failed to load public profile", error);
        }
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  const dominantColor = useMemo(() => {
    const results = assessment?.results || {};
    return (results.primaryColor || results.dominantColor || assessment?.dominant_color || "red").toLowerCase();
  }, [assessment]);

  const secondaryColor = useMemo(() => {
    const results = assessment?.results || {};
    return (results.secondaryColor || "").toLowerCase();
  }, [assessment]);

  const scoreMap = useMemo(() => {
    const rawScores = assessment?.results?.scores || assessment?.results?.colorScores || null;
    if (!rawScores || typeof rawScores !== "object") {
      return [] as Array<{ color: string; score: number; percentage: number }>;
    }

    const totalFromRow = Number(assessment?.total_questions || assessment?.results?.totalQuestions || 0);
    const totalFromScores = Object.values(rawScores).reduce<number>(
      (sum, value) => sum + Number(value || 0),
      0,
    );
    const totalScore: number = totalFromRow > 0 ? totalFromRow : totalFromScores;

    return Object.entries(rawScores)
      .map(([color, score]) => {
        const numericScore = Number(score || 0);
        return {
          color: color.toLowerCase(),
          score: numericScore,
          percentage: totalScore > 0 ? Math.round((numericScore / totalScore) * 100) : 0,
        };
      })
      .sort((left, right) => right.score - left.score);
  }, [assessment]);

  const meta = roleMeta[dominantColor] || roleMeta.red;
  const secondaryMeta = secondaryColor ? roleMeta[secondaryColor] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Profile not found</h1>
          <p className="text-muted-foreground mb-6">This RoleColor social profile is private or does not exist.</p>
          <Button onClick={() => navigate("/free-assessment")}>Take Your Assessment</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeClass[profile.theme] || themeClass.classic}`}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {profile.profile_image_url || person?.avatar_url ? (
                <img
                  src={profile.profile_image_url || person?.avatar_url || ""}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold">
                  {(person?.full_name || username || "R").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">RoleColor Social Profile</p>
                <h1 className="text-3xl font-black mt-1">{person?.full_name || username}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="text-sm" variant="secondary">{meta.emoji} {meta.title}</Badge>
                  {secondaryMeta && <Badge variant="outline">Secondary: {secondaryMeta.emoji} {secondaryMeta.title}</Badge>}
                  <Badge variant="outline">Team Role: {meta.teamRole}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Leadership Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-medium">{meta.leadership}</p>
              <p className="text-muted-foreground">
                Public personality profile powered by RoleColorFinder — think LinkedIn meets identity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {meta.strengths.map((strength) => (
                  <li key={strength}>• {strength}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Full Assessment Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!assessment ? (
              <p className="text-sm text-muted-foreground">No assessment report available for this public profile.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{(assessment.assessment_type || "assessment").toUpperCase()}</Badge>
                  {assessment.created_at && (
                    <Badge variant="outline">{new Date(assessment.created_at).toLocaleDateString()}</Badge>
                  )}
                </div>

                {scoreMap.length > 0 && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Scores</p>
                    {scoreMap.map(({ color, score, percentage }) => (
                      <div key={color} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{color}</span>
                          <span>{score} ({percentage}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${colorBarClass[color] || "bg-primary"}`}
                            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Company Id</p>
                    {renderReportValue(assessment.company_id || assessment.results?.company_id || assessment.results?.companyId)}
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Company Name</p>
                    {renderReportValue(assessment.company_name || assessment.results?.company_name || assessment.results?.companyName)}
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed At</p>
                    {renderReportValue(assessment.completed_at || assessment.results?.completed_at || assessment.results?.completedAt || assessment.created_at)}
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Dominant Color</p>
                    {renderReportValue(assessment.results?.dominantColor || assessment.dominant_color || dominantColor)}
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Assessment Type</p>
                    {renderReportValue(assessment.assessment_type || assessment.results?.assessment_type || assessment.results?.assessmentType)}
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Questions</p>
                    {renderReportValue(assessment.total_questions || assessment.results?.total_questions || assessment.results?.totalQuestions)}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(assessment.results || {})
                    .filter(([key]) => ![
                      "scores",
                      "colorScores",
                      "completedAt",
                      "completed_at",
                      "companyId",
                      "company_id",
                      "companyName",
                      "company_name",
                      "dominantColor",
                      "dominant_color",
                      "assessmentType",
                      "assessment_type",
                      "totalQuestions",
                      "total_questions",
                    ].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="rounded-lg border p-3 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{formatKeyLabel(key)}</p>
                        {renderReportValue(value)}
                      </div>
                    ))}
                </div>

                {Object.keys(assessment.results || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">This assessment does not have structured result fields yet.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Build your own RoleColor social profile</h3>
              <p className="text-sm text-muted-foreground">Customize your URL, pick your featured assessment, and share your identity card.</p>
            </div>
            <Button onClick={() => navigate("/free-assessment")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Take Assessment
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
