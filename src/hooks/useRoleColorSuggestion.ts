import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// RoleColor mappings based on job characteristics
const ROLE_COLOR_KEYWORDS: Record<string, string[]> = {
  yellow: [
    'operations', 'coordinator', 'administrator', 'assistant', 'support', 'logistics',
    'warehouse', 'delivery', 'driver', 'technician', 'maintenance', 'production',
    'manufacturing', 'quality', 'qa', 'tester', 'implementation', 'deployment',
    'devops', 'sre', 'infrastructure', 'it support', 'help desk', 'customer service',
    'account manager', 'project coordinator', 'executive assistant', 'office manager',
    'dispatcher', 'scheduler', 'processor', 'clerk', 'data entry', 'fulfillment'
  ],
  red: [
    'sales', 'marketing', 'brand', 'communications', 'pr', 'public relations',
    'business development', 'account executive', 'recruiter', 'talent', 'hr',
    'human resources', 'trainer', 'coach', 'motivational', 'speaker', 'evangelist',
    'community', 'social media', 'content creator', 'influencer', 'ambassador',
    'customer success', 'relationship', 'partnership', 'fundraiser', 'event',
    'host', 'presenter', 'media', 'advertising', 'copywriter', 'creative director'
  ],
  green: [
    'engineer', 'developer', 'architect', 'analyst', 'data', 'scientist', 'research',
    'financial', 'accountant', 'auditor', 'compliance', 'legal', 'lawyer', 'counsel',
    'actuary', 'economist', 'statistician', 'quantitative', 'backend', 'systems',
    'database', 'security', 'risk', 'underwriter', 'planner', 'logistics analyst',
    'supply chain', 'inventory', 'forecasting', 'bi', 'business intelligence',
    'machine learning', 'ai', 'algorithm', 'optimization', 'software', 'programmer'
  ],
  blue: [
    'designer', 'ux', 'ui', 'product', 'innovation', 'strategy', 'strategist',
    'visionary', 'founder', 'entrepreneur', 'ceo', 'chief', 'director', 'head',
    'vp', 'vice president', 'creative', 'artist', 'writer', 'author', 'editor',
    'researcher', 'r&d', 'futurist', 'consultant', 'advisor', 'thought leader',
    'brand strategist', 'product manager', 'growth', 'transformation', 'change',
    'digital', 'experience', 'journey', 'concept', 'ideation', 'discovery'
  ],
};

const ROLE_COLOR_DESCRIPTIONS: Record<string, string> = {
  yellow: 'Action-first executors who excel at speed, initiative, and getting things done',
  red: 'Vision-driven motivators skilled in communication, persuasion, and inspiring others',
  green: 'Logic-based architects with strengths in systems thinking and structured problem-solving',
  blue: 'Innovation-focused visionaries who excel at ideation, strategy, and long-term thinking',
};

export function suggestRoleColor(positionTitle: string): { color: string; confidence: 'high' | 'medium' | 'low' } | null {
  if (!positionTitle.trim()) return null;
  
  const normalizedTitle = positionTitle.toLowerCase();
  const scores: Record<string, number> = { yellow: 0, red: 0, green: 0, blue: 0 };
  
  // Check each color's keywords
  for (const [color, keywords] of Object.entries(ROLE_COLOR_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedTitle.includes(keyword)) {
        // Longer keyword matches get higher scores
        scores[color] += keyword.split(' ').length;
      }
    }
  }
  
  // Find the highest scoring color
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return null;
  
  const winningColor = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
  if (!winningColor) return null;
  
  // Determine confidence based on score difference
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const scoreDiff = sortedScores[0] - sortedScores[1];
  
  let confidence: 'high' | 'medium' | 'low';
  if (scoreDiff >= 2 || maxScore >= 3) {
    confidence = 'high';
  } else if (scoreDiff >= 1) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return { color: winningColor, confidence };
}

export function useRoleColorSuggestion() {
  const [suggesting, setSuggesting] = useState(false);
  const { toast } = useToast();

  const suggestColor = (positionTitle: string, onSuggest: (color: string) => void) => {
    if (!positionTitle.trim()) {
      toast({
        title: 'Position title required',
        description: 'Enter a position title first to get a suggestion',
        variant: 'destructive',
      });
      return;
    }

    setSuggesting(true);
    
    // Simulate a brief delay for UX
    setTimeout(() => {
      const result = suggestRoleColor(positionTitle);
      
      if (result) {
        onSuggest(result.color);
        toast({
          title: `Suggested: ${result.color.charAt(0).toUpperCase() + result.color.slice(1)}`,
          description: ROLE_COLOR_DESCRIPTIONS[result.color],
        });
      } else {
        toast({
          title: 'No suggestion available',
          description: 'Could not determine ideal color from position title. Please select manually.',
        });
      }
      
      setSuggesting(false);
    }, 300);
  };

  return { suggestColor, suggesting, ROLE_COLOR_DESCRIPTIONS };
}
