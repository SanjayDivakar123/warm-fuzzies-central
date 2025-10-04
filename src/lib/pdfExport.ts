import jsPDF from "jspdf";

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  colorTheme: 'red' | 'yellow' | 'green' | 'blue';
  userName?: string;
  dominantColor?: string;
  secondaryColor?: string;
  strengths?: string[];
  developmentAreas?: string[];
  description?: string;
  includeCharts?: boolean;
  includeActionPlan?: boolean;
}

export const exportToPDF = async (
  reportData: any, 
  filename: string
) => {
  // Convert reportData to PDFExportOptions format
  const options: PDFExportOptions = {
    title: "Leadership Assessment Report",
    subtitle: reportData.type || "Assessment",
    colorTheme: getColorThemeFromData(reportData),
    dominantColor: reportData.color || reportData.results?.dominantColor || "Leader",
    secondaryColor: reportData.results?.secondaryColor,
    description: generateDescription(reportData),
    strengths: generateStrengths(reportData),
    developmentAreas: generateDevelopmentAreas(reportData),
  };
  
  const score = reportData.score || reportData.results?.score || reportData.percentage || 85;
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Define color scheme based on leadership color
    const colorScheme = getColorScheme(options.colorTheme);
    
    // Page 1: Cover Page
    createCoverPage(pdf, options, colorScheme, pageWidth, pageHeight);
    
    // Page 2: Detailed Results
    pdf.addPage();
    createResultsPage(pdf, options, colorScheme, pageWidth, pageHeight, score);
    
    // Page 3: Action Plan
    pdf.addPage();
    createActionPlanPage(pdf, options, colorScheme, pageWidth, pageHeight);
    
    // Save the PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

const getColorThemeFromData = (reportData: any): 'red' | 'yellow' | 'green' | 'blue' => {
  const color = reportData.color || reportData.results?.dominantColor;
  if (['red', 'yellow', 'green', 'blue'].includes(color)) {
    return color as 'red' | 'yellow' | 'green' | 'blue';
  }
  return 'blue'; // default
};

const generateDescription = (reportData: any): string => {
  const color = reportData.color || reportData.results?.dominantColor;
  const descriptions = {
    yellow: "Your leadership style demonstrates strong action-oriented execution combined with excellent goal achievement skills.",
    red: "Your leadership style showcases visionary thinking combined with exceptional motivational capabilities.",
    green: "Your leadership style exhibits strong analytical thinking combined with excellent systematic approach to problem-solving.",
    blue: "Your leadership style demonstrates strong people-focused leadership combined with excellent team collaboration skills."
  };
  return descriptions[color as keyof typeof descriptions] || descriptions.blue;
};

const generateStrengths = (reportData: any): string[] => {
  const color = reportData.color || reportData.results?.dominantColor;
  const strengthsByColor = {
    yellow: ['Goal-Oriented Leadership', 'Quick Decision Making', 'Results-Driven Approach', 'Performance Optimization', 'Action Planning'],
    red: ['Visionary Leadership', 'Team Inspiration', 'Creative Problem Solving', 'Change Management', 'Communication Excellence'],
    green: ['Strategic Analysis', 'Process Optimization', 'Quality Assurance', 'Systematic Planning', 'Data-Driven Decisions'],
    blue: ['Team Building', 'Emotional Intelligence', 'Collaborative Leadership', 'Conflict Resolution', 'Supportive Management']
  };
  return strengthsByColor[color as keyof typeof strengthsByColor] || strengthsByColor.blue;
};

const generateDevelopmentAreas = (reportData: any): string[] => {
  const color = reportData.color || reportData.results?.dominantColor;
  const developmentByColor = {
    yellow: ['Patience in Team Building', 'Detailed Planning', 'Collaborative Decision Making', 'Emotional Awareness'],
    red: ['Structured Implementation', 'Detail-Oriented Planning', 'Analytical Thinking', 'Process Management'],
    green: ['Inspirational Communication', 'Flexibility in Change', 'Team Motivation', 'Quick Decision Making'],
    blue: ['Assertive Leadership', 'Goal-Oriented Focus', 'Performance Management', 'Strategic Vision']
  };
  return developmentByColor[color as keyof typeof developmentByColor] || developmentByColor.blue;
};

const getColorScheme = (colorTheme: string) => {
  const schemes = {
    red: { primary: [220, 38, 38], secondary: [239, 68, 68], light: [254, 226, 226], accent: [127, 29, 29] },
    yellow: { primary: [234, 179, 8], secondary: [251, 191, 36], light: [254, 249, 195], accent: [161, 98, 7] },
    green: { primary: [22, 163, 74], secondary: [34, 197, 94], light: [220, 252, 231], accent: [21, 128, 61] },
    blue: { primary: [37, 99, 235], secondary: [59, 130, 246], light: [219, 234, 254], accent: [30, 64, 175] }
  };
  return schemes[colorTheme as keyof typeof schemes] || schemes.blue;
};

const createCoverPage = (pdf: jsPDF, options: PDFExportOptions, colorScheme: any, pageWidth: number, pageHeight: number) => {
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Add logo at top (if available)
  try {
    // Logo placeholder - centered at top
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
    pdf.text('ROLE COLOR FINDER', pageWidth / 2, 20, { align: 'center' });
  } catch (e) {
    console.log('Logo not available');
  }
  
  // Main title at top
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LEADERSHIP PROFILE REPORT', pageWidth / 2, 45, { align: 'center' });
  
  // Subtitle
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Your Leadership Color', pageWidth / 2, 65, { align: 'center' });
  
  // Descriptive text
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const descLines = pdf.splitTextToSize(
    "Discover your unique leadership style through our comprehensive assessment. Whether you're a Fast Executor, Creative Motivator, Logical Systems Thinker, or Empathetic Connector, this professional analysis reveals your authentic leadership potential.",
    pageWidth - 50
  );
  pdf.text(descLines, pageWidth / 2, 80, { align: 'center' });
  
  // Premium analysis note
  pdf.setFontSize(9);
  const premiumNote = pdf.splitTextToSize(
    "Premium Analysis: Confidential professional report designed for HR leaders, executive coaches, and leadership development programs.",
    pageWidth - 50
  );
  pdf.text(premiumNote, pageWidth / 2, 110, { align: 'center' });
  
  // Call to action
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Swipe to explore your detailed assessment results and personalized action plan.', pageWidth / 2, 135, { align: 'center' });
  pdf.text('Your leadership journey starts here.', pageWidth / 2, 145, { align: 'center' });
  
  // Large color indicator circle in center
  const centerY = 180;
  pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.circle(pageWidth / 2, centerY, 35, 'F');
  
  // Color label on circle
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const colorName = options.dominantColor || 'Leader';
  pdf.text(colorName, pageWidth / 2, centerY + 3, { align: 'center' });
};

const createResultsPage = (pdf: jsPDF, options: PDFExportOptions, colorScheme: any, pageWidth: number, pageHeight: number, score: number) => {
  let currentY = 25;
  
  // Page header
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Your Leadership Assessment Results', pageWidth / 2, currentY, { align: 'center' });
  
  currentY = 50;
  
  // Overall Score - prominently at top
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(48);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${Math.round(score)}%`, pageWidth / 2, currentY, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overall Leadership Score', pageWidth / 2, currentY + 12, { align: 'center' });
  
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Strong leadership potential with excellent growth trajectory', pageWidth / 2, currentY + 22, { align: 'center' });
  
  currentY = 95;
  
  // Two column layout for Strengths and Growth
  const leftColX = 20;
  const rightColX = pageWidth / 2 + 5;
  const colWidth = (pageWidth - 50) / 2;
  
  // Core Strengths (Left Column)
  pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.rect(leftColX, currentY, colWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Core Strengths', leftColX + 5, currentY + 6);
  
  let strengthY = currentY + 18;
  const strengths = options.strengths || [
    'Goal-Oriented Leadership',
    'Quick Decision Making',
    'Results-Driven Approach',
    'Performance Optimization',
    'Action Planning Excellence'
  ];
  
  strengths.slice(0, 5).forEach((strength) => {
    pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
    pdf.circle(leftColX + 7, strengthY + 2, 1.5, 'F');
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.text(strength, leftColX + 12, strengthY + 4);
    strengthY += 7;
  });
  
  // Growth Opportunities (Right Column)
  pdf.setFillColor(colorScheme.accent[0], colorScheme.accent[1], colorScheme.accent[2]);
  pdf.rect(rightColX, currentY, colWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Growth Opportunities', rightColX + 5, currentY + 6);
  
  let growthY = currentY + 18;
  const developmentAreas = options.developmentAreas || [
    'Patience in Team Building',
    'Detailed Strategic Planning',
    'Collaborative Decision Making',
    'Enhanced Emotional Awareness'
  ];
  
  developmentAreas.slice(0, 4).forEach((area) => {
    pdf.setFillColor(colorScheme.accent[0], colorScheme.accent[1], colorScheme.accent[2]);
    pdf.circle(rightColX + 7, growthY + 2, 1.5, 'F');
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.text(area, rightColX + 12, growthY + 4);
    growthY += 7;
  });
  
  // Assessment Areas Section
  currentY = 160;
  pdf.setFillColor(colorScheme.light[0], colorScheme.light[1], colorScheme.light[2]);
  pdf.rect(20, currentY, pageWidth - 40, 8, 'F');
  
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assessment Areas', 25, currentY + 6);
  
  currentY += 18;
  
  // Create horizontal capability bars
  const capabilities = [
    { name: 'Strategic Vision', score: 88 },
    { name: 'Team Influence', score: 82 },
    { name: 'Decision Making', score: 85 },
    { name: 'Communication', score: 79 },
    { name: 'Innovation', score: 91 }
  ];
  
  const barHeight = 8;
  const barSpacing = 15;
  
  capabilities.forEach((capability, index) => {
    const barY = currentY + (index * barSpacing);
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.text(capability.name, 25, barY + 5);
    
    // Background bar
    pdf.setFillColor(230, 230, 230);
    pdf.rect(80, barY, pageWidth - 120, barHeight, 'F');
    
    // Progress bar
    pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
    const progressWidth = (pageWidth - 120) * (capability.score / 100);
    pdf.rect(80, barY, progressWidth, barHeight, 'F');
    
    // Score text
    pdf.text(`${capability.score}%`, pageWidth - 25, barY + 5);
  });
};

const createActionPlanPage = (pdf: jsPDF, options: PDFExportOptions, colorScheme: any, pageWidth: number, pageHeight: number) => {
  let currentY = 30;
  
  // Page header
  pdf.setFillColor(colorScheme.light[0], colorScheme.light[1], colorScheme.light[2]);
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PERSONALIZED ACTION PLAN', 20, 18);
  
  currentY = 45;
  
  // 30-60-90 Day Plan
  const actionPlans = [
    {
      period: '30 DAYS',
      color: colorScheme.primary,
      actions: [
        'Complete leadership self-assessment survey',
        'Schedule 1-on-1 meetings with team members',
        'Identify one key development area to focus on'
      ]
    },
    {
      period: '60 DAYS', 
      color: colorScheme.secondary,
      actions: [
        'Implement new team communication strategy',
        'Begin leadership development course',
        'Seek feedback from direct reports and peers'
      ]
    },
    {
      period: '90 DAYS',
      color: colorScheme.accent,
      actions: [
        'Lead a high-visibility project or initiative',
        'Mentor a junior team member',
        'Present strategic proposal to senior leadership'
      ]
    }
  ];
  
  actionPlans.forEach((plan) => {
    // Period header
    pdf.setFillColor(plan.color[0], plan.color[1], plan.color[2]);
    pdf.rect(20, currentY, pageWidth - 40, 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(plan.period, 25, currentY + 7);
    
    currentY += 18;
    
    // Action items
    plan.actions.forEach((action, index) => {
      pdf.setFillColor(plan.color[0], plan.color[1], plan.color[2]);
      pdf.circle(27, currentY + 2, 1.5, 'F');
      
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.text(`${index + 1}. ${action}`, 32, currentY + 4);
      currentY += 8;
    });
    
    currentY += 10;
  });
  
  // Recommended Resources
  currentY += 10;
  pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.rect(20, currentY, pageWidth - 40, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RECOMMENDED RESOURCES', 25, currentY + 6);
  
  currentY += 20;
  
  const resources = [
    'Leadership Development Course: Advanced Strategic Thinking',
    'Book: "The Leadership Challenge" by Kouzes & Posner',
    'Workshop: Effective Communication for Leaders',
    'Mentorship Program: Senior Leadership Track'
  ];
  
  resources.forEach((resource) => {
    pdf.setFillColor(colorScheme.secondary[0], colorScheme.secondary[1], colorScheme.secondary[2]);
    pdf.circle(27, currentY + 2, 1.5, 'F');
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.text(resource, 32, currentY + 4);
    currentY += 8;
  });
  
  // Footer with contact info
  pdf.setFillColor(colorScheme.light[0], colorScheme.light[1], colorScheme.light[2]);
  pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
  
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Continue Your Leadership Journey', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('www.rolecolorfinder.com | info@rolecolorfinder.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
};