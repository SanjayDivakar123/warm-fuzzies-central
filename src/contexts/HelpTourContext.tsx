import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
}

export interface TourDefinition {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
}

interface HelpTourContextType {
  // Tour state
  activeTour: TourDefinition | null;
  currentStepIndex: number;
  isActive: boolean;
  
  // Tour actions
  startTour: (tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  
  // Tour completion tracking
  hasCompletedTour: (tourId: string) => boolean;
  markTourCompleted: (tourId: string) => void;
  resetTourProgress: (tourId?: string) => void;
  
  // Available tours
  availableTours: TourDefinition[];
  registerTour: (tour: TourDefinition) => void;
}

const HelpTourContext = createContext<HelpTourContextType | undefined>(undefined);

const STORAGE_KEY = 'rcf_completed_tours';

// Admin Dashboard Tours
export const adminDashboardTour: TourDefinition = {
  id: 'admin-dashboard-overview',
  name: 'Dashboard Overview',
  description: 'Learn how to navigate your admin dashboard',
  steps: [
    {
      id: 'welcome',
      target: '[data-tour="dashboard-header"]',
      title: 'Welcome to Your Dashboard! 👋',
      content: 'This is your command center for managing your team\'s leadership assessments. Let\'s take a quick tour!',
      placement: 'bottom',
    },
    {
      id: 'tabs',
      target: '[data-tour="dashboard-tabs"]',
      title: 'Navigation Tabs',
      content: 'Use these tabs to switch between different sections: Overview for stats, Users for team management, Assessments for results, and more.',
      placement: 'bottom',
    },
    {
      id: 'overview-stats',
      target: '[data-tour="overview-stats"]',
      title: 'Quick Stats',
      content: 'See your team\'s progress at a glance: seats used, completed assessments, pending invites, and upcoming reminders.',
      placement: 'bottom',
    },
    {
      id: 'theme-toggle',
      target: '[data-tour="theme-toggle"]',
      title: 'Theme Settings',
      content: 'Switch between light, dark, or system theme to match your preference.',
      placement: 'bottom',
    },
  ],
};

export const adminUsersTour: TourDefinition = {
  id: 'admin-users-management',
  name: 'User Management',
  description: 'Learn how to invite and manage team members',
  steps: [
    {
      id: 'invite-section',
      target: '[data-tour="invite-section"]',
      title: 'Invite Team Members',
      content: 'Enter an email address to send an invite. Each team member gets a unique code to access their assessment.',
      placement: 'bottom',
    },
    {
      id: 'bulk-actions',
      target: '[data-tour="bulk-actions"]',
      title: 'Bulk Import Options',
      content: 'Import multiple users at once via CSV file or sync directly with Google Workspace.',
      placement: 'bottom',
    },
    {
      id: 'users-table',
      target: '[data-tour="users-table"]',
      title: 'Team Members List',
      content: 'View all your team members, their status, and actions. You can resend invites, update roles, and manage access.',
      placement: 'top',
    },
  ],
};

export const adminAssessmentsTour: TourDefinition = {
  id: 'admin-assessments-overview',
  name: 'Assessments & Insights',
  description: 'View team results and AI-powered insights',
  steps: [
    {
      id: 'team-summary',
      target: '[data-tour="team-summary"]',
      title: 'Team Summary',
      content: 'See how your team\'s leadership styles are distributed across the four RoleColors.',
      placement: 'bottom',
    },
    {
      id: 'team-insights',
      target: '[data-tour="team-insights"]',
      title: 'AI Team Insights',
      content: 'Get AI-powered analysis of your team\'s strengths, collaboration tips, and growth opportunities.',
      placement: 'left',
    },
    {
      id: 'individual-results',
      target: '[data-tour="individual-results"]',
      title: 'Individual Results',
      content: 'View detailed assessment results for each team member who has completed their assessment.',
      placement: 'top',
    },
  ],
};

export const adminWorkMatrixTour: TourDefinition = {
  id: 'admin-work-matrix',
  name: 'Work Assigning Matrix',
  description: 'Learn how to use AI-powered task assignment',
  steps: [
    {
      id: 'create-task',
      target: '[data-tour="matrix-tab-create"]',
      title: 'Create a Task',
      content: 'Start by describing the task, setting importance and urgency levels, and selecting required skills.',
      placement: 'bottom',
    },
    {
      id: 'ai-assignment',
      target: '[data-tour="matrix-assignment-explainer"]',
      title: 'What Happens Next',
      content: 'Once you create a task, the Assignment tab unlocks. That screen shows AI recommendations based on RoleColor, skills, and workload.',
      placement: 'bottom',
    },
    {
      id: 'task-history',
      target: '[data-tour="matrix-tab-history"]',
      title: 'Assignment History',
      content: 'Track all past task assignments and their outcomes to improve future decisions.',
      placement: 'bottom',
    },
  ],
};

export const adminHiringLockedTour: TourDefinition = {
  id: 'admin-hiring-locked',
  name: 'Hiring Platform (Locked)',
  description: 'See hiring features and how to unlock access',
  steps: [
    {
      id: 'hiring-overview',
      target: '[data-tour="hiring-locked-overview"]',
      title: 'Hiring Platform Overview',
      content: 'This is your hiring workspace. It includes ATS tools for jobs, candidates, pipeline stages, interviews, offers, templates, and analytics.',
      placement: 'bottom',
    },
    {
      id: 'unlock-access',
      target: '[data-tour="hiring-pricing"]',
      title: 'Unlock Premium Hiring',
      content: 'To unlock Hiring, subscribe from this section. After activation, you will get full access to all hiring tabs and workflows.',
      placement: 'top',
    },
  ],
};

export const adminHiringUnlockedTour: TourDefinition = {
  id: 'admin-hiring-unlocked',
  name: 'Hiring Platform Walkthrough',
  description: 'Walk through each hiring tab and what it does',
  steps: [
    {
      id: 'jobs-1',
      target: '[data-tour="hiring-tab-jobs"]',
      title: 'Jobs',
      content: 'Start in Jobs. This is your command center for creating roles and tracking posting health.',
      placement: 'bottom',
    },
    {
      id: 'jobs-2',
      target: '[data-tour="hiring-jobs-filters"]',
      title: 'Jobs Filters & Status',
      content: 'Use status filters to focus on open, draft, paused, or closed roles. This helps prioritize active hiring.',
      placement: 'bottom',
    },
    {
      id: 'jobs-3',
      target: '[data-tour="hiring-jobs-list"]',
      title: 'Job Cards & Actions',
      content: 'Open a job card menu to jump to Pipeline/Candidates, publish or pause roles, copy application links, and edit details.',
      placement: 'bottom',
    },
    {
      id: 'pipeline-1',
      target: '[data-tour="hiring-tab-pipeline"]',
      title: 'Pipeline Tab',
      content: 'Pipeline gives you a stage-by-stage board for one job at a time so decisions stay focused.',
      placement: 'bottom',
    },
    {
      id: 'pipeline-2',
      target: '[data-tour="hiring-pipeline-selector"]',
      title: 'Choose the Job',
      content: 'Select a role first. The board and metrics update to that job so stage movement is role-specific.',
      placement: 'bottom',
    },
    {
      id: 'pipeline-3',
      target: '[data-tour="hiring-pipeline-board"]',
      title: 'Move Candidates by Stage',
      content: 'Use the board to move candidates forward, reject when needed, and trigger next actions like interviews or offers.',
      placement: 'bottom',
    },
    {
      id: 'candidates-1',
      target: '[data-tour="hiring-tab-candidates"]',
      title: 'Candidates Tab',
      content: 'Candidates is your master list across jobs with full visibility into each applicant.',
      placement: 'bottom',
    },
    {
      id: 'candidates-2',
      target: '[data-tour="hiring-candidates-filters"]',
      title: 'Search, Filter, Segment',
      content: 'Use search plus job/stage/status filters to quickly isolate who needs action now.',
      placement: 'bottom',
    },
    {
      id: 'candidates-3',
      target: '[data-tour="hiring-candidates-table"]',
      title: 'Candidate Actions',
      content: 'From each row, open actions to view profile, send assessment, move stages, schedule interviews, send offers, or reject.',
      placement: 'top',
    },
    {
      id: 'interviews-1',
      target: '[data-tour="hiring-tab-interviews"]',
      title: 'Interviews Tab',
      content: 'Interviews centralizes scheduling and interview outcomes for every active hiring workflow.',
      placement: 'bottom',
    },
    {
      id: 'interviews-2',
      target: '[data-tour="hiring-interviews-controls"]',
      title: 'Plan & Filter Interviews',
      content: 'Filter by interview status and switch between calendar/list to coordinate workload by date or queue.',
      placement: 'bottom',
    },
    {
      id: 'interviews-3',
      target: '[data-tour="hiring-interviews-view"]',
      title: 'Run the Interview Queue',
      content: 'Review day-level schedules, update statuses (completed/no-show/cancelled), and keep candidates moving.',
      placement: 'left',
    },
    {
      id: 'offers-1',
      target: '[data-tour="hiring-tab-offers"]',
      title: 'Offers Tab',
      content: 'Offers manages compensation proposals, approvals, and acceptance tracking in one place.',
      placement: 'bottom',
    },
    {
      id: 'offers-2',
      target: '[data-tour="hiring-offers-controls"]',
      title: 'Create & Filter Offers',
      content: 'Create offers for qualified candidates and filter by status to focus on drafts, sent, and final outcomes.',
      placement: 'bottom',
    },
    {
      id: 'offers-3',
      target: '[data-tour="hiring-offers-table"]',
      title: 'Offer Lifecycle',
      content: 'Track salary/start/expiry fields and use row actions to send, accept, decline, rescind, or review details.',
      placement: 'top',
    },
    {
      id: 'templates-1',
      target: '[data-tour="hiring-tab-templates"]',
      title: 'Templates',
      content: 'Reuse email templates for consistent outreach and faster communication.',
      placement: 'bottom',
    },
    {
      id: 'analytics-1',
      target: '[data-tour="hiring-tab-analytics"]',
      title: 'Analytics',
      content: 'Measure funnel performance, identify bottlenecks, and improve hiring outcomes.',
      placement: 'bottom',
    },
  ],
};

// Employee Tours
export const employeeLoginTour: TourDefinition = {
  id: 'employee-login',
  name: 'Employee Login',
  description: 'How to access your assessment',
  steps: [
    {
      id: 'email-field',
      target: '[data-tour="employee-email"]',
      title: 'Enter Your Email',
      content: 'Use the same email address your administrator registered when inviting you.',
      placement: 'bottom',
    },
    {
      id: 'invite-code',
      target: '[data-tour="employee-code"]',
      title: 'Your Invite Code',
      content: 'Enter the 8-character code from the email invitation you received.',
      placement: 'bottom',
    },
  ],
};

export const employeeAssessmentTour: TourDefinition = {
  id: 'employee-assessment',
  name: 'Taking the Assessment',
  description: 'Tips for completing your assessment',
  steps: [
    {
      id: 'progress',
      target: '[data-tour="assessment-progress"]',
      title: 'Your Progress',
      content: 'Track how far along you are. Your progress is saved automatically if you need to take a break.',
      placement: 'bottom',
    },
    {
      id: 'question',
      target: '[data-tour="assessment-question"]',
      title: 'Answer Questions',
      content: 'Read each scenario and select the response that best describes how you\'d naturally react. There are no right or wrong answers!',
      placement: 'bottom',
    },
    {
      id: 'navigation',
      target: '[data-tour="assessment-navigation"]',
      title: 'Navigation Tips',
      content: 'Use the Previous/Next buttons or press 1-4 to select an answer and Enter to continue.',
      placement: 'top',
    },
  ],
};

export const employeeResultsTour: TourDefinition = {
  id: 'employee-results',
  name: 'Understanding Your Results',
  description: 'Learn about your leadership profile',
  steps: [
    {
      id: 'dominant-color',
      target: '[data-tour="results-color"]',
      title: 'Your Dominant Style',
      content: 'This is your primary leadership style based on your responses. Each color represents different strengths.',
      placement: 'bottom',
    },
    {
      id: 'score-breakdown',
      target: '[data-tour="results-scores"]',
      title: 'Score Breakdown',
      content: 'See how you scored across all four RoleColors. Most people have a mix of styles.',
      placement: 'top',
    },
    {
      id: 'actions',
      target: '[data-tour="results-actions"]',
      title: 'Next Steps',
      content: 'View your full report for detailed insights or download a PDF to share with your team.',
      placement: 'top',
    },
  ],
};

const BUILTIN_TOURS: TourDefinition[] = [
  adminDashboardTour,
  adminUsersTour,
  adminAssessmentsTour,
  adminWorkMatrixTour,
  adminHiringLockedTour,
  adminHiringUnlockedTour,
  employeeLoginTour,
  employeeAssessmentTour,
  employeeResultsTour,
];

export function HelpTourProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());
  const [availableTours, setAvailableTours] = useState<TourDefinition[]>(BUILTIN_TOURS);

  // Load completed tours from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompletedTours(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error('Failed to load tour progress:', e);
    }
  }, []);

  // Save completed tours to localStorage
  const saveCompletedTours = useCallback((tours: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(tours)));
    } catch (e) {
      console.error('Failed to save tour progress:', e);
    }
  }, []);

  // Keep built-in tours in sync (useful during HMR/live edits).
  useEffect(() => {
    setAvailableTours((prev) => {
      const byId = new Map(prev.map((tour) => [tour.id, tour]));
      BUILTIN_TOURS.forEach((tour) => {
        byId.set(tour.id, tour);
      });
      return Array.from(byId.values());
    });
  }, []);

  const startTour = useCallback((tourId: string) => {
    const tour = availableTours.find(t => t.id === tourId);
    if (tour) {
      setActiveTour(tour);
      setCurrentStepIndex(0);
    }
  }, [availableTours]);

  const endTour = useCallback(() => {
    if (activeTour) {
      const newCompleted = new Set(completedTours);
      newCompleted.add(activeTour.id);
      setCompletedTours(newCompleted);
      saveCompletedTours(newCompleted);
    }
    setActiveTour(null);
    setCurrentStepIndex(0);
  }, [activeTour, completedTours, saveCompletedTours]);

  const nextStep = useCallback(() => {
    if (activeTour && currentStepIndex < activeTour.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTour();
    }
  }, [activeTour, currentStepIndex, endTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((index: number) => {
    if (activeTour && index >= 0 && index < activeTour.steps.length) {
      setCurrentStepIndex(index);
    }
  }, [activeTour]);

  const hasCompletedTour = useCallback((tourId: string) => {
    return completedTours.has(tourId);
  }, [completedTours]);

  const markTourCompleted = useCallback((tourId: string) => {
    const newCompleted = new Set(completedTours);
    newCompleted.add(tourId);
    setCompletedTours(newCompleted);
    saveCompletedTours(newCompleted);
  }, [completedTours, saveCompletedTours]);

  const resetTourProgress = useCallback((tourId?: string) => {
    if (tourId) {
      const newCompleted = new Set(completedTours);
      newCompleted.delete(tourId);
      setCompletedTours(newCompleted);
      saveCompletedTours(newCompleted);
    } else {
      setCompletedTours(new Set());
      saveCompletedTours(new Set());
    }
  }, [completedTours, saveCompletedTours]);

  const registerTour = useCallback((tour: TourDefinition) => {
    setAvailableTours(prev => {
      if (prev.some(t => t.id === tour.id)) {
        return prev.map(t => t.id === tour.id ? tour : t);
      }
      return [...prev, tour];
    });
  }, []);

  return (
    <HelpTourContext.Provider
      value={{
        activeTour,
        currentStepIndex,
        isActive: !!activeTour,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        hasCompletedTour,
        markTourCompleted,
        resetTourProgress,
        availableTours,
        registerTour,
      }}
    >
      {children}
    </HelpTourContext.Provider>
  );
}

// Default context for when hook is used outside provider (e.g., TourTooltip before mount)
const defaultContext: HelpTourContextType = {
  activeTour: null,
  currentStepIndex: 0,
  isActive: false,
  startTour: () => {},
  endTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  hasCompletedTour: () => false,
  markTourCompleted: () => {},
  resetTourProgress: () => {},
  availableTours: [],
  registerTour: () => {},
};

export function useHelpTour() {
  const context = useContext(HelpTourContext);
  // Return default context if not within provider (prevents crash during SSR/initial mount)
  return context || defaultContext;
}
