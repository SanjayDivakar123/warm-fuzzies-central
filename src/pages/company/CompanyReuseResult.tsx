import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCompanyPortal } from "@/contexts/CompanyPortalContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Sparkles,
} from "lucide-react";

const colorStyles: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
};

export default function CompanyReuseResult() {
  const {
    company,
    employee,
    reusableAssessments,
    loading,
    setEmployee,
    setReusableAssessments,
  } = useCompanyPortal();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!loading && company) {
      if (!employee) {
        navigate(`/company/${company.subdomain}/login`);
        return;
      }

      if (employee.assessment_completed_at) {
        navigate(`/company/${company.subdomain}/home`);
        return;
      }

      if (reusableAssessments.length === 0) {
        navigate(`/company/${company.subdomain}/assessment`);
      }
    }
  }, [loading, company, employee, reusableAssessments, navigate]);

  useEffect(() => {
    if (reusableAssessments.length > 0 && !selectedAssessmentId) {
      setSelectedAssessmentId(reusableAssessments[0].id);
    }
  }, [reusableAssessments, selectedAssessmentId]);

  const selectedAssessment = useMemo(
    () => reusableAssessments.find((assessment) => assessment.id === selectedAssessmentId) ?? null,
    [reusableAssessments, selectedAssessmentId],
  );

  const handleTakeCompanyAssessment = () => {
    if (!company) return;
    navigate(`/company/${company.subdomain}/assessment`);
  };

  const handleImportAssessment = async () => {
    if (!company || !employee || !employee.invite_code || !selectedAssessmentId) return;

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-company-assessment-result", {
        body: {
          employeeId: employee.id,
          companyId: company.id,
          inviteCode: employee.invite_code,
          sourceAssessmentResultId: selectedAssessmentId,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.message || "Failed to import your saved assessment.")
      }

      setEmployee(data.employee);
      setReusableAssessments([]);

      toast({
        title: "Saved assessment added",
        description: "Your saved report is now attached to this company invite.",
      });

      navigate(`/company/${company.subdomain}/results`);
    } catch (err: any) {
      console.error("Import assessment error:", err);
      toast({
        title: "Import failed",
        description: err?.message || "We couldn't attach that saved assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loading || !company || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const primaryColor = company.primary_color || "#9b87f5";
  const secondaryColor = company.secondary_color || "#7E69AB";

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 100%)` }}
    >
      <header className="py-4 px-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-10 w-auto object-contain" />
          ) : (
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <p className="font-semibold">{company.name}</p>
            <p className="text-sm text-muted-foreground">Choose how to complete your company assessment</p>
          </div>
        </div>
      </header>

      <main className="py-10 px-4">
        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="shadow-xl border-2" style={{ borderColor: `${primaryColor}20` }}>
            <CardHeader>
              <Badge
                variant="secondary"
                className="w-fit mb-3"
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              >
                Saved Paid Assessments Found
              </Badge>
              <CardTitle className="text-3xl">Use a saved result or take this company test</CardTitle>
              <CardDescription className="text-base">
                We found saved paid assessments for <strong>{employee.email}</strong>. You can attach one to
                this company invite, or take the company-issued assessment instead.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <RadioGroup value={selectedAssessmentId} onValueChange={setSelectedAssessmentId} className="space-y-4">
                {reusableAssessments.map((assessment) => {
                  const dominantColor = assessment.dominantColor?.toLowerCase() || "";
                  const badgeClass = colorStyles[dominantColor] || "bg-muted text-foreground";
                  const completedDate = new Date(assessment.completedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={assessment.id}
                      className={`rounded-2xl border-2 p-5 transition-all ${
                        selectedAssessmentId === assessment.id
                          ? "border-primary bg-background shadow-md"
                          : "border-border/60 bg-background/70"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={assessment.id} id={assessment.id} className="mt-1" />
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <Label htmlFor={assessment.id} className="text-lg font-semibold cursor-pointer">
                                {assessment.displayName}
                              </Label>
                              <p className="text-sm text-muted-foreground">{assessment.sourceLabel}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {assessment.dominantColor && (
                                <Badge className={badgeClass}>
                                  {assessment.dominantColor.charAt(0).toUpperCase() +
                                    assessment.dominantColor.slice(1)}
                                </Badge>
                              )}
                              <Badge variant={assessment.matchesCompanyAssessment ? "default" : "outline"}>
                                {assessment.matchesCompanyAssessment ? "Matches company test" : "Different test type"}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                            <div>Completed: {completedDate}</div>
                            <div>
                              Questions: {assessment.totalQuestions ? assessment.totalQuestions : "Saved report"}
                            </div>
                          </div>

                          {selectedAssessmentId === assessment.id && assessment.mismatchWarning && (
                            <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Different Assessment</AlertTitle>
                              <AlertDescription>{assessment.mismatchWarning}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 h-fit" style={{ borderColor: `${secondaryColor}20` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: secondaryColor }} />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-background/80 p-4">
                <p className="font-medium mb-1">If you use a saved result</p>
                <p className="text-sm text-muted-foreground">
                  We’ll create a company copy of that report and mark this invite as completed right away.
                </p>
              </div>

              <div className="rounded-xl border bg-background/80 p-4">
                <p className="font-medium mb-1">If you take the company test</p>
                <p className="text-sm text-muted-foreground">
                  Your personal saved reports stay untouched, and this company invite gets its own separate result.
                </p>
              </div>

              {selectedAssessment && selectedAssessment.matchesCompanyAssessment && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Strong match</p>
                      <p className="text-sm">
                        This saved result matches the assessment type currently assigned by the company.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Button
                  className="w-full"
                  onClick={handleImportAssessment}
                  disabled={!selectedAssessmentId || isImporting}
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Saved Result...
                    </>
                  ) : (
                    <>
                      Use Selected Saved Result
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full" onClick={handleTakeCompanyAssessment}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Take Company Assessment Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
