// Centralized assessment question loader for B2B platform
// Supports all assessment categories and question counts

import { professionalQuestions25Q, professionalQuestions50Q, type ProfessionalQuestion } from './professionalAssessmentQuestions';
import { entrepreneurQuestions25Q, entrepreneurQuestions50Q, type EntrepreneurQuestion } from './entrepreneurAssessmentQuestions';
import { executiveQuestions25Q, executiveQuestions50Q } from './executiveAssessmentQuestions';
import { managerQuestions25Q, managerQuestions50Q, type ManagerQuestion } from './managerAssessmentQuestions';

export type AssessmentCategory = 'professional' | 'entrepreneur' | 'executive' | 'manager';
export type AssessmentType = '25q' | '50q';

export interface AssessmentQuestion {
  id: number;
  section: string;
  question: string;
  options: {
    text: string;
    color: "yellow" | "red" | "green" | "blue";
  }[];
}

// Add IDs to executive questions if they don't have them
function addIdsToQuestions(questions: any[]): AssessmentQuestion[] {
  return questions.map((q, index) => ({
    ...q,
    id: q.id ?? index + 1,
  }));
}

// Get questions based on category and type
export function getAssessmentQuestions(
  category: AssessmentCategory,
  type: AssessmentType
): AssessmentQuestion[] {
  switch (category) {
    case 'professional':
      return type === '50q' 
        ? addIdsToQuestions(professionalQuestions50Q)
        : addIdsToQuestions(professionalQuestions25Q);
    
    case 'entrepreneur':
      return type === '50q'
        ? addIdsToQuestions(entrepreneurQuestions50Q)
        : addIdsToQuestions(entrepreneurQuestions25Q);
    
    case 'executive':
      return type === '50q'
        ? addIdsToQuestions(executiveQuestions50Q)
        : addIdsToQuestions(executiveQuestions25Q);
    
    case 'manager':
      return type === '50q'
        ? addIdsToQuestions(managerQuestions50Q)
        : addIdsToQuestions(managerQuestions25Q);
    
    default:
      // Default to professional if category is unknown
      return type === '50q'
        ? addIdsToQuestions(professionalQuestions50Q)
        : addIdsToQuestions(professionalQuestions25Q);
  }
}

// Get display name for assessment category
export function getCategoryDisplayName(category: AssessmentCategory): string {
  const names: Record<AssessmentCategory, string> = {
    professional: 'Professional',
    entrepreneur: 'Entrepreneur',
    executive: 'Executive / Senior Leader',
    manager: 'Manager / Mid-Level Leader',
  };
  return names[category] || 'Professional';
}

// Get short name for assessment category
export function getCategoryShortName(category: AssessmentCategory): string {
  const names: Record<AssessmentCategory, string> = {
    professional: 'Professional',
    entrepreneur: 'Entrepreneur',
    executive: 'Executive',
    manager: 'Manager',
  };
  return names[category] || 'Professional';
}
