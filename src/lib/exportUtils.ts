// Utility functions for exporting data to CSV/Excel

export function exportToCSV(data: Record<string, any>[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first row if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Handle null/undefined
        if (value === null || value === undefined) return '';
        // Handle arrays
        if (Array.isArray(value)) return `"${value.join('; ')}"`;
        // Handle objects
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        // Handle strings with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  
  // Create and download blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportUsersToCSV(users: any[], companyName: string) {
  const exportData = users.map(user => ({
    email: user.email,
    full_name: user.full_name || '',
    job_role: user.job_role || '',
    status: user.status,
    role: user.role,
    skills: user.skills || [],
    assessment_completed: user.assessment_completed_at ? 'Yes' : 'No',
    assessment_date: user.assessment_completed_at 
      ? new Date(user.assessment_completed_at).toLocaleDateString() 
      : '',
    joined_date: user.joined_at 
      ? new Date(user.joined_at).toLocaleDateString() 
      : '',
    invited_date: user.invited_at 
      ? new Date(user.invited_at).toLocaleDateString() 
      : '',
  }));

  const headers = [
    'email',
    'full_name',
    'job_role',
    'status',
    'role',
    'skills',
    'assessment_completed',
    'assessment_date',
    'joined_date',
    'invited_date'
  ];

  const filename = `${companyName.replace(/\s+/g, '_')}_users_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(exportData, filename, headers);
}

export function exportCandidatesToCSV(candidates: any[], companyName: string) {
  const exportData = candidates.map(candidate => ({
    email: candidate.email,
    full_name: candidate.full_name || '',
    position_title: candidate.position_title || '',
    status: candidate.status,
    fit_score: candidate.fit_score || '',
    ideal_role_color: candidate.ideal_role_color || '',
    source: candidate.source || '',
    assessment_completed: candidate.assessment_completed_at ? 'Yes' : 'No',
    assessment_date: candidate.assessment_completed_at 
      ? new Date(candidate.assessment_completed_at).toLocaleDateString() 
      : '',
    created_date: candidate.created_at 
      ? new Date(candidate.created_at).toLocaleDateString() 
      : '',
    notes: candidate.notes || '',
  }));

  const headers = [
    'email',
    'full_name',
    'position_title',
    'status',
    'fit_score',
    'ideal_role_color',
    'source',
    'assessment_completed',
    'assessment_date',
    'created_date',
    'notes'
  ];

  const filename = `${companyName.replace(/\s+/g, '_')}_candidates_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(exportData, filename, headers);
}

export function exportAssessmentsToCSV(assessments: any[], companyName: string) {
  const exportData = assessments.map(assessment => ({
    email: assessment.email || assessment.company_users?.email || '',
    full_name: assessment.full_name || assessment.company_users?.full_name || '',
    dominant_color: assessment.results?.dominantColor || '',
    secondary_color: assessment.results?.secondaryColor || '',
    yellow_score: assessment.results?.scores?.yellow || assessment.results?.yellow || '',
    red_score: assessment.results?.scores?.red || assessment.results?.red || '',
    green_score: assessment.results?.scores?.green || assessment.results?.green || '',
    blue_score: assessment.results?.scores?.blue || assessment.results?.blue || '',
    completed_date: assessment.created_at 
      ? new Date(assessment.created_at).toLocaleDateString() 
      : '',
  }));

  const headers = [
    'email',
    'full_name',
    'dominant_color',
    'secondary_color',
    'yellow_score',
    'red_score',
    'green_score',
    'blue_score',
    'completed_date'
  ];

  const filename = `${companyName.replace(/\s+/g, '_')}_assessments_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(exportData, filename, headers);
}

export function exportAuditLogToCSV(logs: any[], companyName: string) {
  const exportData = logs.map(log => ({
    timestamp: new Date(log.created_at).toLocaleString(),
    action: log.action,
    entity_type: log.entity_type,
    user_email: log.user_email || '',
    details: JSON.stringify(log.details || {}),
    ip_address: log.ip_address || '',
  }));

  const headers = [
    'timestamp',
    'action',
    'entity_type',
    'user_email',
    'details',
    'ip_address'
  ];

  const filename = `${companyName.replace(/\s+/g, '_')}_audit_log_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(exportData, filename, headers);
}
