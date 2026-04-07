export const CHATGPT_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg';

export const SUPABASE_FUNCTIONS_BASE_URL = `${
  import.meta.env.VITE_SUPABASE_URL || 'https://qbuxoetprodjxpagfkoi.supabase.co'
}/functions/v1`;

export const BUSINESS_CHATGPT_TOOLS = [
  { key: 'get_my_rolecolor', label: 'Get My RoleColor', description: "Return the admin's own RoleColor profile." },
  { key: 'get_team_roster', label: 'Get Team Roster', description: 'List the org roster with RoleColor context.' },
  { key: 'get_team_composition', label: 'Get Team Composition', description: 'Summarize team balance and distribution.' },
  { key: 'get_compatibility', label: 'Get Compatibility', description: 'Compare two RoleColors and their working dynamic.' },
  { key: 'get_person_profile', label: 'Get Person Profile', description: 'Look up a specific teammate by name or email.' },
  { key: 'get_conflict_advice', label: 'Get Conflict Advice', description: 'Coach through hard conversations and team friction.' },
  { key: 'get_communication_style', label: 'Get Communication Style', description: 'Draft RoleColor-aware communication guidance.' },
  { key: 'suggest_hire_rolecolor', label: 'Suggest Hire RoleColor', description: 'Recommend the next RoleColor to hire.' },
  { key: 'get_pending_assessments', label: 'Get Pending Assessments', description: 'Show who still needs to complete an assessment.' },
] as const;

export const PERSONAL_CHATGPT_TOOLS = [
  { key: 'get_my_rolecolor', label: 'Get My RoleColor', description: 'Return your own RoleColor profile.' },
  { key: 'get_compatibility', label: 'Get Compatibility', description: 'Compare two RoleColors and their working dynamic.' },
  { key: 'get_conflict_advice', label: 'Get Conflict Advice', description: 'Coach through hard conversations and team friction.' },
  { key: 'get_communication_style', label: 'Get Communication Style', description: 'Draft RoleColor-aware communication guidance.' },
] as const;

export const roleColorBadgeClass = (color: string | null | undefined) => {
  switch (color?.toLowerCase()) {
    case 'red':
      return 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300';
    case 'yellow':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200';
    case 'green':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    case 'blue':
      return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-200';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
};

export const formatTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return 'Never';
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};
