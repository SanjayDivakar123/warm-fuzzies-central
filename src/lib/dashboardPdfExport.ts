import jsPDF from 'jspdf';

interface TrendDataPoint {
  date: string;
  count: number;
}

interface DashboardStats {
  companyName: string;
  seatsUsed: number;
  seatsPurchased: number;
  totalUsers: number;
  completedAssessments: number;
  pendingInvites: number;
  completionRate: number;
  colorDistribution: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
  reminderStats: {
    total: number;
    pending: number;
    sent: number;
  };
  exportDate: string;
  completionTrend?: TrendDataPoint[];
}

const colorLabels = {
  yellow: 'Executor',
  red: 'Motivator', 
  green: 'Organizer',
  blue: 'Innovator',
};

const colorHex = {
  yellow: '#EAB308',
  red: '#EF4444',
  green: '#22C55E',
  blue: '#3B82F6',
};

export const exportDashboardPdf = (stats: DashboardStats) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Header
  pdf.setFillColor(34, 197, 94); // Primary green
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(stats.companyName, margin, 25);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Dashboard Report', margin, 33);

  // Export date on right
  pdf.setFontSize(10);
  pdf.text(`Generated: ${stats.exportDate}`, pageWidth - margin, 33, { align: 'right' });

  y = 55;

  // Section: Quick Stats
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Quick Stats', margin, y);
  y += 10;

  const drawStatBox = (label: string, value: string, x: number, boxY: number, width: number) => {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x, boxY, width, 25, 3, 3, 'F');
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, x + 5, boxY + 8);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, x + 5, boxY + 20);
  };

  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  drawStatBox('Seats Used', `${stats.seatsUsed}/${stats.seatsPurchased}`, margin, y, boxWidth);
  drawStatBox('Completed', stats.completedAssessments.toString(), margin + boxWidth + 5, y, boxWidth);
  drawStatBox('Pending', stats.pendingInvites.toString(), margin + (boxWidth + 5) * 2, y, boxWidth);
  drawStatBox('Reminders', stats.reminderStats.pending.toString(), margin + (boxWidth + 5) * 3, y, boxWidth);

  y += 35;

  // Section: Assessment Progress
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assessment Progress', margin, y);
  y += 8;

  // Progress bar background
  const barWidth = pageWidth - margin * 2;
  pdf.setFillColor(229, 231, 235);
  pdf.roundedRect(margin, y, barWidth, 8, 2, 2, 'F');

  // Progress bar fill
  const fillWidth = (stats.completionRate / 100) * barWidth;
  pdf.setFillColor(34, 197, 94);
  pdf.roundedRect(margin, y, fillWidth, 8, 2, 2, 'F');

  y += 12;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Completion Rate: ${stats.completionRate}% (${stats.completedAssessments} of ${stats.totalUsers} users)`, margin, y);

  y += 15;

  // Section: Completion Trend Chart (if data available)
  if (stats.completionTrend && stats.completionTrend.length > 0) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Assessment Completions Over Time', margin, y);
    y += 8;

    const chartWidth = pageWidth - margin * 2;
    const chartHeight = 50;
    const chartX = margin;
    const chartY = y;

    // Chart background
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, 'F');

    // Draw grid lines
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    for (let i = 1; i < 4; i++) {
      const gridY = chartY + (chartHeight / 4) * i;
      pdf.line(chartX + 5, gridY, chartX + chartWidth - 5, gridY);
    }

    // Find max value for scaling
    const maxCount = Math.max(...stats.completionTrend.map(d => d.count), 1);
    const dataPoints = stats.completionTrend;
    
    if (dataPoints.length > 1) {
      // Draw area fill
      const pointSpacing = (chartWidth - 20) / (dataPoints.length - 1);
      
      pdf.setFillColor(34, 197, 94, 0.2);
      
      // Draw connecting lines
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(1.5);
      
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const x1 = chartX + 10 + i * pointSpacing;
        const y1 = chartY + chartHeight - 10 - ((dataPoints[i].count / maxCount) * (chartHeight - 20));
        const x2 = chartX + 10 + (i + 1) * pointSpacing;
        const y2 = chartY + chartHeight - 10 - ((dataPoints[i + 1].count / maxCount) * (chartHeight - 20));
        pdf.line(x1, y1, x2, y2);
      }

      // Draw data points
      pdf.setFillColor(34, 197, 94);
      dataPoints.forEach((point, i) => {
        const x = chartX + 10 + i * pointSpacing;
        const pointY = chartY + chartHeight - 10 - ((point.count / maxCount) * (chartHeight - 20));
        pdf.circle(x, pointY, 2, 'F');
      });

      // Draw x-axis labels (dates)
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      
      // Only show first, middle, and last dates to avoid crowding
      const labelIndices = [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1];
      labelIndices.forEach(i => {
        if (i < dataPoints.length) {
          const x = chartX + 10 + i * pointSpacing;
          pdf.text(dataPoints[i].date, x, chartY + chartHeight - 2, { align: 'center' });
        }
      });
    } else if (dataPoints.length === 1) {
      // Single data point
      pdf.setFillColor(34, 197, 94);
      const x = chartX + chartWidth / 2;
      const pointY = chartY + chartHeight / 2;
      pdf.circle(x, pointY, 3, 'F');
      
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${dataPoints[0].count} on ${dataPoints[0].date}`, x, pointY + 10, { align: 'center' });
    }

    y += chartHeight + 10;
  }

  // Section: Team Color Distribution
  if (stats.completedAssessments > 0) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Team Color Distribution', margin, y);
    y += 10;

    const colorBoxWidth = (pageWidth - margin * 2 - 15) / 4;
    let colorX = margin;

    Object.entries(stats.colorDistribution).forEach(([color, count]) => {
      const label = colorLabels[color as keyof typeof colorLabels];
      const hex = colorHex[color as keyof typeof colorHex];
      
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(colorX, y, colorBoxWidth, 40, 3, 3, 'F');

      // Color circle
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      pdf.setFillColor(r, g, b);
      pdf.circle(colorX + colorBoxWidth / 2, y + 12, 6, 'F');

      // Count
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(count.toString(), colorX + colorBoxWidth / 2, y + 28, { align: 'center' });

      // Label
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(label, colorX + colorBoxWidth / 2, y + 36, { align: 'center' });

      colorX += colorBoxWidth + 5;
    });

    y += 50;
  }

  // Section: Reminder Activity
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Reminder Activity', margin, y);
  y += 10;

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  
  const reminderColWidth = (pageWidth - margin * 2) / 3;
  pdf.text('Sent', margin + reminderColWidth / 2, y + 10, { align: 'center' });
  pdf.text('Scheduled', margin + reminderColWidth * 1.5, y + 10, { align: 'center' });
  pdf.text('Total', margin + reminderColWidth * 2.5, y + 10, { align: 'center' });

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(stats.reminderStats.sent.toString(), margin + reminderColWidth / 2, y + 22, { align: 'center' });
  pdf.text(stats.reminderStats.pending.toString(), margin + reminderColWidth * 1.5, y + 22, { align: 'center' });
  pdf.text(stats.reminderStats.total.toString(), margin + reminderColWidth * 2.5, y + 22, { align: 'center' });

  y += 45;

  // Footer
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, pdf.internal.pageSize.getHeight() - 20, pageWidth, 20, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by RoleColorFinder Dashboard', pageWidth / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });

  // Save the PDF
  const fileName = `${stats.companyName.replace(/\s+/g, '-').toLowerCase()}-dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
