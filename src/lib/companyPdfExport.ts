import jsPDF from "jspdf";

interface ColorDescription {
  title: string;
  subtitle: string;
  workDescription: string;
  strengths: string[];
  situations: { title: string; description: string }[];
  weaknesses: { title: string; description: string; solution: string }[];
  color: string;
}

interface CompanyPDFData {
  companyName: string;
  companyLogo?: string;
  dominantColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
  colorInfo: ColorDescription;
  primaryColor: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [100, 100, 100];
};

export const exportCompanyResultsPDF = async (data: CompanyPDFData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  const colorRgb = hexToRgb(data.colorInfo.color);
  const primaryRgb = hexToRgb(data.primaryColor);
  
  let currentY = margin;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // ===== HEADER =====
  pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.companyName, margin, 15);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Leadership Assessment Results', margin, 25);
  
  currentY = 50;

  // ===== TITLE SECTION =====
  pdf.setFillColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  pdf.circle(pageWidth / 2, currentY + 15, 20, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('YOU ARE', pageWidth / 2, currentY + 12, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text(data.colorInfo.subtitle.toUpperCase(), pageWidth / 2, currentY + 20, { align: 'center' });
  
  currentY += 45;
  
  pdf.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.colorInfo.title, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;

  // ===== LEADERSHIP STYLE =====
  checkNewPage(60);
  
  pdf.setFillColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  pdf.rect(margin, currentY, contentWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Your Leadership Style', margin + 5, currentY + 6);
  
  currentY += 15;
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const styleLines = pdf.splitTextToSize(data.colorInfo.workDescription, contentWidth);
  pdf.text(styleLines, margin, currentY);
  currentY += styleLines.length * 4.5 + 10;

  // ===== KEY STRENGTHS =====
  checkNewPage(40);
  
  pdf.setFillColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  pdf.rect(margin, currentY, contentWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Your Key Strengths', margin + 5, currentY + 6);
  
  currentY += 15;
  
  const strengthsPerRow = 3;
  const strengthWidth = contentWidth / strengthsPerRow - 5;
  
  data.colorInfo.strengths.forEach((strength, index) => {
    const col = index % strengthsPerRow;
    const row = Math.floor(index / strengthsPerRow);
    const x = margin + (col * (strengthWidth + 5));
    const y = currentY + (row * 12);
    
    pdf.setFillColor(colorRgb[0], colorRgb[1], colorRgb[2], 0.1);
    pdf.setDrawColor(colorRgb[0], colorRgb[1], colorRgb[2]);
    pdf.roundedRect(x, y, strengthWidth, 10, 2, 2, 'FD');
    
    pdf.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`✓ ${strength}`, x + 3, y + 6.5);
  });
  
  currentY += Math.ceil(data.colorInfo.strengths.length / strengthsPerRow) * 12 + 15;

  // ===== HOW YOU APPROACH SITUATIONS =====
  checkNewPage(80);
  
  pdf.setFillColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  pdf.rect(margin, currentY, contentWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('How You Approach Situations', margin + 5, currentY + 6);
  
  currentY += 15;
  
  const situationWidth = (contentWidth - 5) / 2;
  
  data.colorInfo.situations.forEach((situation, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + (col * (situationWidth + 5));
    const y = currentY + (row * 30);
    
    // Check if we need new page for this row
    if (row > 0 && col === 0) {
      checkNewPage(30);
    }
    
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(colorRgb[0], colorRgb[1], colorRgb[2]);
    pdf.roundedRect(x, y, situationWidth, 25, 2, 2, 'FD');
    
    pdf.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(situation.title, x + 3, y + 6);
    
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(situation.description, situationWidth - 6);
    pdf.text(descLines.slice(0, 3), x + 3, y + 12);
  });
  
  currentY += Math.ceil(data.colorInfo.situations.length / 2) * 30 + 10;

  // ===== COLOR PROFILE =====
  checkNewPage(70);
  
  pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  pdf.rect(margin, currentY, contentWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Your Complete Color Profile', margin + 5, currentY + 6);
  
  currentY += 15;
  
  // Sort with dominant first
  const sortedScores = Object.entries(data.scores)
    .sort(([colorA], [colorB]) => {
      if (colorA === data.dominantColor) return -1;
      if (colorB === data.dominantColor) return 1;
      return data.scores[colorB as keyof typeof data.scores] - data.scores[colorA as keyof typeof data.scores];
    });
  
  const colorHexMap: Record<string, string> = {
    yellow: '#EAB308',
    red: '#EF4444',
    green: '#22C55E',
    blue: '#3B82F6'
  };
  
  sortedScores.forEach(([color, score], index) => {
    const percentage = Math.round((score / data.totalQuestions) * 100);
    const barColor = hexToRgb(colorHexMap[color]);
    const y = currentY + (index * 12);
    
    // Color name
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(color.charAt(0).toUpperCase() + color.slice(1), margin, y + 5);
    
    if (index === 0) {
      pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
      pdf.roundedRect(margin + 25, y, 20, 6, 1, 1, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(6);
      pdf.text('DOMINANT', margin + 27, y + 4.5);
    }
    
    // Background bar
    const barX = margin + 50;
    const barWidth = contentWidth - 70;
    pdf.setFillColor(230, 230, 230);
    pdf.roundedRect(barX, y, barWidth, 6, 1, 1, 'F');
    
    // Progress bar
    pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
    pdf.roundedRect(barX, y, barWidth * (percentage / 100), 6, 1, 1, 'F');
    
    // Percentage
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.text(`${percentage}%`, pageWidth - margin, y + 5, { align: 'right' });
  });
  
  currentY += sortedScores.length * 12 + 15;

  // ===== AREAS TO WATCH =====
  checkNewPage(100);
  
  pdf.setFillColor(245, 158, 11); // Amber
  pdf.rect(margin, currentY, contentWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Areas to Watch & Solutions', margin + 5, currentY + 6);
  
  currentY += 15;
  
  data.colorInfo.weaknesses.forEach((weakness, index) => {
    checkNewPage(35);
    
    const boxHeight = 30;
    
    // Weakness box
    pdf.setFillColor(255, 251, 235); // Amber-50
    pdf.setDrawColor(245, 158, 11);
    pdf.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');
    
    // Title
    pdf.setTextColor(146, 64, 14); // Amber-800
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(weakness.title, margin + 5, currentY + 6);
    
    // Description
    pdf.setTextColor(120, 53, 15); // Amber-700
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(weakness.description, contentWidth - 10);
    pdf.text(descLines.slice(0, 2), margin + 5, currentY + 12);
    
    // Solution
    pdf.setFillColor(220, 252, 231); // Green-100
    pdf.roundedRect(margin + 3, currentY + 18, contentWidth - 6, 9, 1, 1, 'F');
    
    pdf.setTextColor(21, 128, 61); // Green-700
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text('💡 Solution: ', margin + 5, currentY + 24);
    pdf.setFont('helvetica', 'normal');
    const solutionLines = pdf.splitTextToSize(weakness.solution, contentWidth - 30);
    pdf.text(solutionLines[0], margin + 22, currentY + 24);
    
    currentY += boxHeight + 5;
  });

  // ===== FOOTER =====
  const footerY = pageHeight - 15;
  pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  pdf.rect(0, footerY - 5, pageWidth, 20, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Powered by RoleColorFinder | www.rolecolorfinder.com', pageWidth / 2, footerY + 3, { align: 'center' });
  
  // Save PDF
  const filename = `${data.companyName.replace(/\s+/g, '_')}_Leadership_Results.pdf`;
  pdf.save(filename);
  
  return true;
};
