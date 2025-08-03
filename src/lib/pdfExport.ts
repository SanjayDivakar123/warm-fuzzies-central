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
    createResultsPage(pdf, options, colorScheme, pageWidth, pageHeight);
    
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
  // Background gradient effect
  pdf.setFillColor(colorScheme.light[0], colorScheme.light[1], colorScheme.light[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header banner
  pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  // Company logo area
  pdf.setFillColor(255, 255, 255);
  pdf.circle(30, 30, 15, 'F');
  
  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ROLE COLOR FINDER', 55, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Professional Leadership Assessment', 55, 35);
  
  // Date
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 50, 25);
  
  // Main title section
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  const titleY = 100;
  pdf.text('LEADERSHIP', pageWidth / 2, titleY, { align: 'center' });
  pdf.text('PROFILE REPORT', pageWidth / 2, titleY + 15, { align: 'center' });
  
  // User's color result - large showcase
  pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.roundedRect(pageWidth / 2 - 40, titleY + 30, 80, 50, 10, 10, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(options.dominantColor || 'Leader', pageWidth / 2, titleY + 60, { align: 'center' });
  
  // Subtitle
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Your Leadership Color Profile', pageWidth / 2, titleY + 100, { align: 'center' });
  
  // Professional badge
  pdf.setFillColor(colorScheme.secondary[0], colorScheme.secondary[1], colorScheme.secondary[2]);
  pdf.roundedRect(pageWidth / 2 - 30, titleY + 120, 60, 20, 5, 5, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PREMIUM ANALYSIS', pageWidth / 2, titleY + 135, { align: 'center' });
  
  // Footer
  pdf.setTextColor(120, 120, 120);
  pdf.setFontSize(10);
  pdf.text('Confidential Professional Report', pageWidth / 2, pageHeight - 20, { align: 'center' });
};

const createResultsPage = (pdf: jsPDF, options: PDFExportOptions, colorScheme: any, pageWidth: number, pageHeight: number) => {
  let currentY = 30;
  
  // Page header
  pdf.setFillColor(colorScheme.light[0], colorScheme.light[1], colorScheme.light[2]);
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DETAILED ASSESSMENT RESULTS', 20, 18);
  
  currentY = 40;
  
  // Leadership Profile Section
  pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.rect(20, currentY, pageWidth - 40, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YOUR LEADERSHIP PROFILE', 25, currentY + 6);
  
  currentY += 20;
  
  // Profile description
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const description = options.description || "Your leadership style demonstrates strong analytical thinking combined with excellent team collaboration skills.";
  const descriptionLines = pdf.splitTextToSize(description, pageWidth - 50);
  pdf.text(descriptionLines, 25, currentY);
  currentY += descriptionLines.length * 5 + 10;
  
  // Strengths Section
  pdf.setFillColor(colorScheme.secondary[0], colorScheme.secondary[1], colorScheme.secondary[2]);
  pdf.rect(20, currentY, (pageWidth - 50) / 2, 6, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CORE STRENGTHS', 25, currentY + 4);
  
  currentY += 15;
  
  const strengths = options.strengths || [
    'Strategic Vision & Planning',
    'Team Leadership & Motivation', 
    'Decision Making Under Pressure',
    'Effective Communication',
    'Innovation & Creativity'
  ];
  
  strengths.slice(0, 5).forEach((strength, index) => {
    // Bullet point
    pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
    pdf.circle(27, currentY + 2, 1.5, 'F');
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.text(strength, 32, currentY + 4);
    currentY += 8;
  });
  
  // Development Areas Section  
  const developmentY = 90;
  pdf.setFillColor(colorScheme.accent[0], colorScheme.accent[1], colorScheme.accent[2]);
  pdf.rect(pageWidth / 2 + 5, developmentY, (pageWidth - 50) / 2, 6, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GROWTH OPPORTUNITIES', pageWidth / 2 + 10, developmentY + 4);
  
  let devCurrentY = developmentY + 15;
  
  const developmentAreas = options.developmentAreas || [
    'Delegation & Trust Building',
    'Conflict Resolution',
    'Public Speaking Confidence',
    'Long-term Strategic Planning'
  ];
  
  developmentAreas.slice(0, 4).forEach((area) => {
    pdf.setFillColor(colorScheme.accent[0], colorScheme.accent[1], colorScheme.accent[2]);
    pdf.circle(pageWidth / 2 + 12, devCurrentY + 2, 1.5, 'F');
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.text(area, pageWidth / 2 + 17, devCurrentY + 4);
    devCurrentY += 8;
  });
  
  // Leadership Metrics Section
  currentY = 160;
  pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.rect(20, currentY, pageWidth - 40, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LEADERSHIP CAPABILITY METRICS', 25, currentY + 6);
  
  currentY += 20;
  
  // Create capability bars
  const capabilities = [
    { name: 'Strategic Vision', score: 88 },
    { name: 'Team Influence', score: 82 },
    { name: 'Decision Making', score: 85 },
    { name: 'Communication', score: 79 },
    { name: 'Innovation', score: 91 }
  ];
  
  capabilities.forEach((capability) => {
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.text(capability.name, 25, currentY + 4);
    pdf.text(`${capability.score}%`, pageWidth - 35, currentY + 4);
    
    // Background bar
    pdf.setFillColor(230, 230, 230);
    pdf.rect(25, currentY + 6, pageWidth - 80, 4, 'F');
    
    // Progress bar
    pdf.setFillColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
    pdf.rect(25, currentY + 6, (pageWidth - 80) * (capability.score / 100), 4, 'F');
    
    currentY += 15;
  });
  
  // Overall Score Box
  currentY += 10;
  pdf.setFillColor(colorScheme.light[0], colorScheme.light[1], colorScheme.light[2]);
  pdf.roundedRect(20, currentY, pageWidth - 40, 25, 5, 5, 'F');
  
  pdf.setTextColor(colorScheme.primary[0], colorScheme.primary[1], colorScheme.primary[2]);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OVERALL LEADERSHIP SCORE: 85%', pageWidth / 2, currentY + 12, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Strong leadership potential with excellent growth trajectory', pageWidth / 2, currentY + 20, { align: 'center' });
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