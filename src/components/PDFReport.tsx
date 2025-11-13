import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssessmentResults } from "@/lib/assessmentScoring";

const COLOR_INFO = {
  Yellow: { bg: "bg-yellow-500", name: "Yellow - The Doer", hex: "#eab308" },
  Red: { bg: "bg-red-500", name: "Red - The Motivator", hex: "#ef4444" },
  Green: { bg: "bg-green-500", name: "Green - The Thinker", hex: "#22c55e" },
  Blue: { bg: "bg-blue-500", name: "Blue - The Creator", hex: "#3b82f6" }
};

interface PDFReportProps {
  results: AssessmentResults;
  analysis: any;
  reportType: string;
}

export const PDFReport = ({ results, analysis, reportType }: PDFReportProps) => {
  const primaryColor = COLOR_INFO[results.primaryColor as keyof typeof COLOR_INFO];
  const secondaryColor = COLOR_INFO[results.secondaryColor as keyof typeof COLOR_INFO];
  
  const getTitle = () => {
    const titles: Record<string, string> = { 
      "50q-teacher": "50-Question Teacher Assessment", 
      "50q-student": "50-Question Student Assessment", 
      "25q-teacher": "25-Question Teacher Assessment", 
      "25q-student": "25-Question Student Assessment" 
    };
    return titles[reportType] || "Leadership Assessment";
  };

  const is25QTeacher = reportType === "25q-teacher";
  const is50QTeacher = reportType === "50q-teacher";
  const is25QStudent = reportType === "25q-student";
  const is50QStudent = reportType === "50q-student";

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          .section-spacing {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
          }
        }
      `}</style>

      {/* Header with gradient */}
      <div 
        className="rounded-lg p-8 mb-8 text-center page-break-avoid"
        style={{
          background: `linear-gradient(135deg, ${primaryColor.hex} 0%, ${secondaryColor.hex} 100%)`,
        }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">{getTitle()}</h1>
        <p className="text-white/90 text-lg">RCF Leadership Color Profile Report</p>
      </div>

      {/* Primary and Secondary Colors */}
      <div className="grid grid-cols-2 gap-6 mb-8 page-break-avoid section-spacing">
        <div className="text-center p-6 rounded-lg border-2" style={{ borderColor: primaryColor.hex }}>
          <div 
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: primaryColor.hex }}
          >
            <span className="text-white font-bold text-2xl">{results.colorScores[results.primaryColor]}</span>
          </div>
          <h3 className="font-bold text-lg mb-1">Primary Color</h3>
          <p className="text-xl font-semibold" style={{ color: primaryColor.hex }}>{primaryColor.name}</p>
        </div>
        <div className="text-center p-6 rounded-lg border-2" style={{ borderColor: secondaryColor.hex }}>
          <div 
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: secondaryColor.hex }}
          >
            <span className="text-white font-bold text-2xl">{results.colorScores[results.secondaryColor]}</span>
          </div>
          <h3 className="font-bold text-lg mb-1">Secondary Color</h3>
          <p className="text-xl font-semibold" style={{ color: secondaryColor.hex }}>{secondaryColor.name}</p>
        </div>
      </div>

      {/* Leadership Stage */}
      {analysis?.leadershipStage && (
        <div className="mb-8 p-6 rounded-lg page-break-avoid section-spacing" style={{ backgroundColor: `${primaryColor.hex}15` }}>
          <h3 className="font-bold text-xl mb-2" style={{ color: primaryColor.hex }}>Leadership Stage</h3>
          <p className="text-2xl font-semibold mb-2">{analysis.leadershipStage}</p>
          {analysis.stageDescription && <p className="text-gray-700">{analysis.stageDescription}</p>}
        </div>
      )}

      {/* 25Q Teacher Report Sections */}
      {is25QTeacher && (
        <>
          {/* Strengths and Watch-Outs */}
          <div className="page-break-before"></div>
          <div className="grid grid-cols-2 gap-6 mb-8 page-break-avoid section-spacing">
            <div className="p-6 rounded-lg border-2 border-emerald-500">
              <h3 className="font-bold text-xl mb-4 text-emerald-700">Strengths</h3>
              <ul className="space-y-2">
                {analysis?.strengths?.slice(0, 3).map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-lg border-2 border-amber-500">
              <h3 className="font-bold text-xl mb-4 text-amber-700">Watch-Outs</h3>
              <ul className="space-y-2">
                {analysis?.watchOuts?.slice(0, 3).map((w: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-amber-600 font-bold">⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Color Profile */}
          {analysis?.colorProfile && (
            <div className="mb-8 p-6 rounded-lg bg-gray-50 page-break-avoid section-spacing">
              <h3 className="font-bold text-xl mb-3" style={{ color: primaryColor.hex }}>Color Profile</h3>
              <p className="text-gray-700 leading-relaxed">{analysis.colorProfile}</p>
            </div>
          )}

          {/* Category Breakdown */}
          {analysis?.condensedCategories && (
            <div className="mb-8 page-break-avoid section-spacing">
              <h3 className="font-bold text-2xl mb-4" style={{ color: primaryColor.hex }}>Category Breakdown</h3>
              <div className="space-y-4">
                {['Communication', 'Decision-Making', 'Conflict', 'Team Behavior', 'Stress Style'].map((category) => {
                  const categoryData = analysis.condensedCategories[category];
                  if (!categoryData) return null;
                  return (
                    <div key={category} className="p-4 rounded-lg bg-gray-50 border-l-4 page-break-avoid" style={{ borderLeftColor: primaryColor.hex }}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-lg">{category}</h4>
                        <span className="font-bold" style={{ color: primaryColor.hex }}>{categoryData.score}/100</span>
                      </div>
                      <p className="text-gray-700 text-sm">{categoryData.interpretation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Growth Plan */}
          {analysis?.growthPlan && (
            <div className="p-6 rounded-lg page-break-avoid section-spacing" style={{ backgroundColor: `${secondaryColor.hex}15` }}>
              <h3 className="font-bold text-2xl mb-4" style={{ color: secondaryColor.hex }}>Growth Plan</h3>
              <ul className="space-y-3">
                {analysis.growthPlan.slice(0, 4).map((item: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-bold" style={{ color: secondaryColor.hex }}>{i + 1}.</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* 50Q Teacher Report Sections */}
      {is50QTeacher && analysis && (
        <>
          <div className="page-break-before"></div>

          {/* Executive Summary */}
          {analysis.executiveSummary && (
            <div className="mb-8 p-6 rounded-lg bg-gray-50 page-break-avoid section-spacing">
              <h3 className="font-bold text-2xl mb-3" style={{ color: primaryColor.hex }}>Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed">{analysis.executiveSummary}</p>
            </div>
          )}

          {/* Strengths & Blind Spots */}
          <div className="grid grid-cols-2 gap-6 mb-8 page-break-avoid section-spacing">
            <div className="p-6 rounded-lg border-2 border-emerald-500">
              <h3 className="font-bold text-xl mb-4 text-emerald-700">Strengths</h3>
              <ul className="space-y-2">
                {analysis.strengths?.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-lg border-2 border-red-500">
              <h3 className="font-bold text-xl mb-4 text-red-700">Blind Spots</h3>
              <ul className="space-y-2">
                {analysis.blindSpots?.map((b: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-red-600">⚠</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Category Insights */}
          {analysis.categoryInsights && (
            <div className="mb-8 page-break-avoid section-spacing">
              <h3 className="font-bold text-2xl mb-4" style={{ color: primaryColor.hex }}>Category Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(analysis.categoryInsights).map(([category, data]: [string, any]) => (
                  <div key={category} className="p-4 rounded-lg bg-gray-50 border-l-4 page-break-avoid" style={{ borderLeftColor: primaryColor.hex }}>
                    <h4 className="font-bold mb-2">{category}</h4>
                    <p className="text-xs text-gray-700">{data.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Plan */}
          <div className="page-break-before"></div>
          <div className="p-6 rounded-lg mb-4 page-break-avoid section-spacing" style={{ backgroundColor: `${secondaryColor.hex}15` }}>
            <h3 className="font-bold text-2xl mb-4" style={{ color: secondaryColor.hex }}>Growth Plan</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <h4 className="font-semibold mb-2 text-emerald-700">Start Doing</h4>
                <ul className="space-y-1">
                  {analysis.startDoing?.map((item: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1"><span>•</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-red-700">Stop Doing</h4>
                <ul className="space-y-1">
                  {analysis.stopDoing?.map((item: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1"><span>•</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-700">Continue Doing</h4>
                <ul className="space-y-1">
                  {analysis.continueDoing?.map((item: string, i: number) => (
                    <li key={i} className="text-xs flex gap-1"><span>•</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 50Q Student Report Sections */}
      {is50QStudent && analysis && (
        <>
          <div className="page-break-before"></div>

          {/* Leadership Summary Section */}
          {analysis.groupBehavior && (
            <div className="mb-8 p-6 rounded-lg bg-gray-50 page-break-avoid section-spacing">
              <h3 className="font-bold text-2xl mb-3" style={{ color: primaryColor.hex }}>How You Show Up in Group Work</h3>
              <p className="text-gray-700 leading-relaxed mb-3">{analysis.groupBehavior}</p>
              {analysis.colorDescription && (
                <p className="text-gray-600 italic">{analysis.colorDescription}</p>
              )}
            </div>
          )}

          {/* Color Profile Card */}
          <div className="mb-8 page-break-avoid section-spacing">
            <h3 className="font-bold text-2xl mb-4" style={{ color: primaryColor.hex }}>Your Color Profile</h3>
            
            {/* Strengths */}
            {analysis.strengths && (
              <div className="mb-4 p-6 rounded-lg border-2 border-emerald-500">
                <h4 className="font-bold text-lg mb-3 text-emerald-700">Strengths</h4>
                <ul className="space-y-2">
                  {analysis.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Communication & Pressure Handling */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {analysis.communicationStyle && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-2">How You Communicate</h4>
                  <p className="text-sm text-gray-700">{analysis.communicationStyle}</p>
                </div>
              )}
              {analysis.pressureHandling && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-2">How You Handle Pressure</h4>
                  <p className="text-sm text-gray-700">{analysis.pressureHandling}</p>
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          {analysis.categoryInsights && (
            <div className="mb-8 page-break-avoid section-spacing">
              <h3 className="font-bold text-2xl mb-4" style={{ color: primaryColor.hex }}>Category Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(analysis.categoryInsights).map(([category, data]: [string, any]) => (
                  <div key={category} className="page-break-avoid">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold">{category}</h4>
                      <span className="font-semibold text-sm" style={{ color: primaryColor.hex }}>
                        {results.categoryScores[category]}/100
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mb-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${results.categoryScores[category]}%`,
                          backgroundColor: primaryColor.hex 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-700 mb-1">{data.explanation}</p>
                    <p className="text-xs text-gray-600 italic">Example: {data.schoolExample}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leadership Stage */}
          <div className="page-break-before"></div>
          {analysis.leadershipStage && (
            <div className="mb-8 p-6 rounded-lg page-break-avoid section-spacing" style={{ backgroundColor: `${primaryColor.hex}15` }}>
              <h3 className="font-bold text-2xl mb-3" style={{ color: primaryColor.hex }}>Your Leadership Stage</h3>
              <div className="inline-block px-4 py-2 rounded-full mb-3" style={{ backgroundColor: primaryColor.hex }}>
                <span className="text-white font-bold">{analysis.leadershipStage}</span>
              </div>
              <p className="text-gray-700">{analysis.stageDescription}</p>
            </div>
          )}

          {/* Growth Plan */}
          {analysis.growthPlan && (
            <div className="mb-8 p-6 rounded-lg page-break-avoid section-spacing" style={{ backgroundColor: `${secondaryColor.hex}15` }}>
              <h3 className="font-bold text-2xl mb-4" style={{ color: secondaryColor.hex }}>Your Growth Plan</h3>
              <ul className="space-y-3">
                {analysis.growthPlan.map((item: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-bold text-xl" style={{ color: secondaryColor.hex }}>•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Team Collaboration Map */}
          {analysis.teamFitInsight && (
            <div className="mb-8 page-break-avoid section-spacing">
              <h3 className="font-bold text-2xl mb-3" style={{ color: primaryColor.hex }}>Team Collaboration Map</h3>
              <p className="text-gray-700 mb-4">{analysis.teamFitInsight}</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(results.colorScores).map(([color, score]: [string, any]) => {
                  const colorInfo = COLOR_INFO[color as keyof typeof COLOR_INFO];
                  return (
                    <div key={color} className="flex items-center gap-2 p-3 rounded-lg border">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: colorInfo.hex }} />
                      <div>
                        <p className="font-medium text-sm">{color}</p>
                        <p className="text-xs text-gray-600">{score}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 25Q Student Report Sections */}
      {is25QStudent && analysis && (
        <>
          <div className="page-break-before"></div>

          {/* Group Work Behavior */}
          {analysis.groupBehavior && (
            <div className="mb-8 p-6 rounded-lg bg-gray-50 page-break-avoid section-spacing">
              <h3 className="font-bold text-xl mb-3" style={{ color: primaryColor.hex }}>How You Work in Groups</h3>
              <p className="text-gray-700">{analysis.groupBehavior}</p>
            </div>
          )}

          {/* Quick Tips */}
          {analysis.quickTips && (
            <div className="p-6 rounded-lg page-break-avoid section-spacing" style={{ backgroundColor: `${primaryColor.hex}15` }}>
              <h3 className="font-bold text-xl mb-3" style={{ color: primaryColor.hex }}>Quick Tips</h3>
              <ul className="space-y-2">
                {analysis.quickTips.slice(0, 3).map((tip: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="font-bold" style={{ color: primaryColor.hex }}>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t-2 text-center text-gray-500 text-sm page-break-avoid">
        <p>RCF Leadership Assessment Report • {new Date().toLocaleDateString()}</p>
        <p className="mt-2">© Role Color Finder - Discover Your Leadership Potential</p>
      </div>
    </div>
  );
};
