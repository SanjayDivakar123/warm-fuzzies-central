import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  SlidersHorizontal,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  Tag,
  RotateCcw,
} from 'lucide-react';
import { debounce } from 'lodash';

interface SearchFilters {
  query: string;
  jobIds: string[];
  stageIds: string[];
  fitScoreMin: number;
  fitScoreMax: number;
  roleColors: string[];
  locations: string[];
  appliedAfter: string;
  appliedBefore: string;
  sources: string[];
  tags: string[];
  hasAssessment: boolean | null;
  isRejected: boolean | null;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  use_count: number;
  last_used_at: string | null;
}

interface AdvancedCandidateSearchProps {
  companyId: string;
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  initialFilters?: Partial<SearchFilters>;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  jobIds: [],
  stageIds: [],
  fitScoreMin: 0,
  fitScoreMax: 100,
  roleColors: [],
  locations: [],
  appliedAfter: '',
  appliedBefore: '',
  sources: [],
  tags: [],
  hasAssessment: null,
  isRejected: null,
};

const ROLE_COLORS = [
  { value: 'red', label: 'Red (Driver)', color: '#ef4444' },
  { value: 'blue', label: 'Blue (Analyst)', color: '#3b82f6' },
  { value: 'green', label: 'Green (Supporter)', color: '#22c55e' },
  { value: 'yellow', label: 'Yellow (Promoter)', color: '#eab308' },
];

const SOURCES = [
  { value: 'direct', label: 'Direct Application' },
  { value: 'careers_page', label: 'Careers Page' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'referral', label: 'Referral' },
  { value: 'agency', label: 'Agency' },
  { value: 'other', label: 'Other' },
];

export default function AdvancedCandidateSearch({
  companyId,
  onSearch,
  onReset,
  initialFilters,
}: AdvancedCandidateSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string; job_title: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    jobs: true,
    stages: false,
    fitScore: false,
    roleColors: false,
    dates: false,
    sources: false,
    tags: false,
  });

  const { toast } = useToast();

  // Count active filters
  const activeFilterCount = [
    filters.query,
    filters.jobIds.length > 0,
    filters.stageIds.length > 0,
    filters.fitScoreMin > 0 || filters.fitScoreMax < 100,
    filters.roleColors.length > 0,
    filters.locations.length > 0,
    filters.appliedAfter,
    filters.appliedBefore,
    filters.sources.length > 0,
    filters.tags.length > 0,
    filters.hasAssessment !== null,
    filters.isRejected !== null,
  ].filter(Boolean).length;

  useEffect(() => {
    fetchFilterOptions();
  }, [companyId]);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('id, title')
        .eq('company_id', companyId)
        .order('title');

      setJobs(jobsData || []);

      // Fetch stages
      const { data: stagesData } = await supabase
        .from('hiring_pipeline_stages')
        .select('id, name, job_posting_id, job_postings(title)')
        .eq('job_postings.company_id', companyId)
        .order('stage_order');

      setStages(
        (stagesData || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          job_title: s.job_postings?.title || 'Unknown Job',
        }))
      );

      // Fetch tags
      const { data: tagsData } = await supabase
        .from('candidate_tags')
        .select('id, name, color')
        .eq('company_id', companyId)
        .order('name');

      setTags(tagsData || []);

      // Fetch saved searches
      const { data: savedData } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('company_id', companyId)
        .order('use_count', { ascending: false })
        .limit(10);

      setSavedSearches((savedData || []) as unknown as SavedSearch[]);
    } catch (err) {
      console.error('Error loading filter options:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((newFilters: SearchFilters) => {
      onSearch(newFilters);
    }, 300),
    [onSearch]
  );

  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onReset();
  };

  const saveSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: 'Enter a name',
        description: 'Please give your search a name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('saved_searches').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: searchName,
        filters: filters as any,
      });

      if (error) throw error;

      toast({ title: 'Search saved' });
      setShowSaveDialog(false);
      setSearchName('');
      fetchFilterOptions();
    } catch (err: any) {
      toast({
        title: 'Error saving search',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const loadSavedSearch = async (search: SavedSearch) => {
    setFilters(search.filters);
    onSearch(search.filters);

    // Update use count
    await supabase
      .from('saved_searches')
      .update({
        use_count: search.use_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', search.id);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleArrayFilter = (
    field: 'jobIds' | 'stageIds' | 'roleColors' | 'sources' | 'tags',
    value: string
  ) => {
    const current = filters[field];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilters({ [field]: updated });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Search & Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(!showSaveDialog)}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, skills..."
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="flex gap-2">
            <Input
              placeholder="Search name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={saveSearch}>
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {savedSearches.slice(0, 5).map(search => (
              <Button
                key={search.id}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => loadSavedSearch(search)}
              >
                {search.name}
              </Button>
            ))}
          </div>
        )}

        {/* Job Filter */}
        <Collapsible open={openSections.jobs} onOpenChange={() => toggleSection('jobs')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
              {filters.jobIds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.jobIds.length}
                </Badge>
              )}
            </span>
            {openSections.jobs ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {jobs.map(job => (
              <label key={job.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.jobIds.includes(job.id)}
                  onCheckedChange={() => toggleArrayFilter('jobIds', job.id)}
                />
                <span className="text-sm">{job.title}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Fit Score Filter */}
        <Collapsible open={openSections.fitScore} onOpenChange={() => toggleSection('fitScore')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Fit Score
              {(filters.fitScoreMin > 0 || filters.fitScoreMax < 100) && (
                <Badge variant="secondary" className="text-xs">
                  {filters.fitScoreMin}-{filters.fitScoreMax}%
                </Badge>
              )}
            </span>
            {openSections.fitScore ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-2">
            <div className="space-y-4">
              <Slider
                value={[filters.fitScoreMin, filters.fitScoreMax]}
                min={0}
                max={100}
                step={5}
                onValueChange={([min, max]) =>
                  updateFilters({ fitScoreMin: min, fitScoreMax: max })
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filters.fitScoreMin}%</span>
                <span>{filters.fitScoreMax}%</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Role Colors Filter */}
        <Collapsible open={openSections.roleColors} onOpenChange={() => toggleSection('roleColors')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              Role Colors
              {filters.roleColors.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.roleColors.length}
                </Badge>
              )}
            </span>
            {openSections.roleColors ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {ROLE_COLORS.map(color => (
              <label key={color.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.roleColors.includes(color.value)}
                  onCheckedChange={() => toggleArrayFilter('roleColors', color.value)}
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-sm">{color.label}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Date Range Filter */}
        <Collapsible open={openSections.dates} onOpenChange={() => toggleSection('dates')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Applied Date
              {(filters.appliedAfter || filters.appliedBefore) && (
                <Badge variant="secondary" className="text-xs">
                  Set
                </Badge>
              )}
            </span>
            {openSections.dates ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={filters.appliedAfter}
                  onChange={(e) => updateFilters({ appliedAfter: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={filters.appliedBefore}
                  onChange={(e) => updateFilters({ appliedBefore: e.target.value })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Sources Filter */}
        <Collapsible open={openSections.sources} onOpenChange={() => toggleSection('sources')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              Sources
              {filters.sources.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.sources.length}
                </Badge>
              )}
            </span>
            {openSections.sources ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {SOURCES.map(source => (
              <label key={source.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.sources.includes(source.value)}
                  onCheckedChange={() => toggleArrayFilter('sources', source.value)}
                />
                <span className="text-sm">{source.label}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Tags Filter */}
        {tags.length > 0 && (
          <Collapsible open={openSections.tags} onOpenChange={() => toggleSection('tags')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.tags.length}
                  </Badge>
                )}
              </span>
              {openSections.tags ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {tags.map(tag => (
                <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.tags.includes(tag.id)}
                    onCheckedChange={() => toggleArrayFilter('tags', tag.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Quick Filters */}
        <div className="pt-2 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick Filters</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.hasAssessment === true ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() =>
                updateFilters({
                  hasAssessment: filters.hasAssessment === true ? null : true,
                })
              }
            >
              Has Assessment
            </Button>
            <Button
              variant={filters.isRejected === false ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() =>
                updateFilters({
                  isRejected: filters.isRejected === false ? null : false,
                })
              }
            >
              Active Only
            </Button>
            <Button
              variant={filters.fitScoreMin >= 80 ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() =>
                updateFilters({
                  fitScoreMin: filters.fitScoreMin >= 80 ? 0 : 80,
                  fitScoreMax: 100,
                })
              }
            >
              High Fit (80%+)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
