import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  User, 
  Users, 
  Briefcase, 
  ClipboardList,
  Loader2,
  Command as CommandIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'user' | 'candidate' | 'task';
  title: string;
  subtitle: string;
  metadata?: string;
}

interface GlobalSearchProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser?: (userId: string) => void;
  onSelectCandidate?: (candidateId: string) => void;
  onSelectTask?: (taskId: string) => void;
}

const TYPE_CONFIG = {
  user: {
    icon: User,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
    label: 'User',
  },
  candidate: {
    icon: Users,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
    label: 'Candidate',
  },
  task: {
    icon: Briefcase,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
    label: 'Task',
  },
};

export default function GlobalSearch({ 
  companyId, 
  open, 
  onOpenChange,
  onSelectUser,
  onSelectCandidate,
  onSelectTask,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, companyId]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Search users (including job_description and job_role)
      const { data: users } = await supabase
        .from('company_users')
        .select('id, email, full_name, role, job_role, skills')
        .eq('company_id', companyId)
        .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,job_role.ilike.%${searchQuery}%`)
        .limit(5);

      if (users) {
        users.forEach(user => {
          // Also check if query matches any skill
          const skillMatch = user.skills?.some((s: string) => 
            s.toLowerCase().includes(lowerQuery)
          );
          
          searchResults.push({
            id: user.id,
            type: 'user',
            title: user.full_name || user.email,
            subtitle: user.job_role || user.email,
            metadata: skillMatch ? `${user.role} • Skills match` : user.role,
          });
        });
      }

      // Search candidates
      const { data: candidates } = await supabase
        .from('candidates')
        .select('id, email, full_name, position_title, status')
        .eq('company_id', companyId)
        .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,position_title.ilike.%${searchQuery}%`)
        .limit(5);

      if (candidates) {
        candidates.forEach(candidate => {
          searchResults.push({
            id: candidate.id,
            type: 'candidate',
            title: candidate.full_name || candidate.email,
            subtitle: candidate.position_title || candidate.email,
            metadata: candidate.status,
          });
        });
      }

      // Search tasks
      const { data: tasks } = await supabase
        .from('work_tasks')
        .select('id, title, description, status')
        .eq('company_id', companyId)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (tasks) {
        tasks.forEach(task => {
          searchResults.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: task.description?.slice(0, 50) || 'No description',
            metadata: task.status,
          });
        });
      }

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    
    switch (result.type) {
      case 'user':
        onSelectUser?.(result.id);
        break;
      case 'candidate':
        onSelectCandidate?.(result.id);
        break;
      case 'task':
        onSelectTask?.(result.id);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onOpenChange(false);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search users, candidates, tasks..."
            className="border-0 focus-visible:ring-0 h-12 text-base"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        
        <ScrollArea className="max-h-[400px]">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CommandIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Type at least 2 characters to search</p>
              <p className="text-xs mt-1">Search across users, candidates, and tasks</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => {
                const config = TYPE_CONFIG[result.type];
                const Icon = config.icon;
                
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                      index === selectedIndex && 'bg-muted'
                    )}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={cn('p-2 rounded-lg', config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {result.metadata && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {result.metadata}
                        </Badge>
                      )}
                      <Badge className={cn('text-xs', config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
