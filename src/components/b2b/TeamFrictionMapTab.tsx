import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Search,
  Target,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  buildPairDetail,
  buildPairFromMembers,
  buildRelevantPairs,
  type CompanyMember,
  type PairRisk,
  type RelevantPair,
  ROLE_COLOR_META,
  resolveRoleColor,
} from '@/lib/teamFrictionMap';
import { cn } from '@/lib/utils';

interface TeamFrictionMapTabProps {
  company: {
    id: string;
    name: string;
  };
}

type ViewMode = 'map' | 'pairs';
const ALL_DEPARTMENTS_VALUE = '__all_departments__';
const UNASSIGNED_DEPARTMENTS_VALUE = '__unassigned_departments__';

const VIEW_OPTIONS: Array<{
  key: ViewMode;
  label: string;
  description: string;
  icon: typeof Target;
}> = [
  {
    key: 'map',
    label: 'Team Friction Map',
    description: 'Role-based risk patterns across your team',
    icon: Target,
  },
  {
    key: 'pairs',
    label: 'Pair Analyzer',
    description: 'Compare any two teammates side by side',
    icon: Users,
  },
];

const RISK_LABELS: Record<PairRisk, string> = {
  high: 'High risk',
  medium: 'Medium risk',
  low: 'Low risk',
};

const RISK_STYLES: Record<PairRisk, string> = {
  high: 'border-red-200 bg-red-50 text-red-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function MemberAvatar({ member, className = '' }: { member: CompanyMember; className?: string }) {
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const color = member.roleColor ? ROLE_COLOR_META[member.roleColor] : null;

  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold',
        className,
      )}
      style={{
        backgroundColor: color?.tint ?? 'hsl(var(--muted))',
        borderColor: color?.hex ?? 'hsl(var(--border))',
        color: color?.text ?? 'hsl(var(--muted-foreground))',
      }}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  );
}

function RiskBadge({ risk }: { risk: PairRisk }) {
  return (
    <Badge variant="outline" className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', RISK_STYLES[risk])}>
      {RISK_LABELS[risk]}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string | number;
  caption: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}


function PairDetailDialog({
  pair,
  open,
  onOpenChange,
}: {
  pair: RelevantPair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!pair) return null;

  const detail = buildPairDetail(pair);
  const hasBothAssessments = Boolean(pair.a.roleColor && pair.b.roleColor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/30 px-6 py-5 text-left">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-3">
                  <MemberAvatar member={pair.a} className="h-12 w-12 border-2 border-background" />
                  <MemberAvatar member={pair.b} className="h-12 w-12 border-2 border-background" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{pair.a.name} and {pair.b.name}</DialogTitle>
                  <DialogDescription className="mt-1 text-sm">
                    {pair.a.jobRole && pair.b.jobRole ? `${pair.a.jobRole} and ${pair.b.jobRole}` : 'Pair detail'}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasBothAssessments ? <RiskBadge risk={pair.risk} /> : (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-semibold">
                    Assessment needed
                  </Badge>
                )}
                {pair.a.roleColor ? (
                  <Badge
                    variant="outline"
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      borderColor: ROLE_COLOR_META[pair.a.roleColor].hex,
                      color: ROLE_COLOR_META[pair.a.roleColor].text,
                      backgroundColor: ROLE_COLOR_META[pair.a.roleColor].tint,
                    }}
                  >
                    {pair.a.roleColor} - {ROLE_COLOR_META[pair.a.roleColor].label}
                  </Badge>
                ) : null}
                {pair.b.roleColor ? (
                  <Badge
                    variant="outline"
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      borderColor: ROLE_COLOR_META[pair.b.roleColor].hex,
                      color: ROLE_COLOR_META[pair.b.roleColor].text,
                      backgroundColor: ROLE_COLOR_META[pair.b.roleColor].tint,
                    }}
                  >
                    {pair.b.roleColor} - {ROLE_COLOR_META[pair.b.roleColor].label}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="space-y-6 px-6 py-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{detail.title}</CardTitle>
                <CardDescription className="text-sm leading-6 text-muted-foreground">
                  {detail.summary}
                </CardDescription>
              </CardHeader>
              {pair.collabReason ? (
                <CardContent className="pt-0">
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {pair.collabReason}
                  </div>
                </CardContent>
              ) : null}
            </Card>

            {!detail.assessmentReady ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This read is using partial data. Completing both assessments will make the playbook much more precise.
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Strengths</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {detail.strengths.map((item) => (
                    <div key={item} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="leading-6">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Watchouts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {detail.watchouts.map((item) => (
                    <div key={item} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-amber-500" />
                      <p className="leading-6">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Next actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {detail.actions.map((item, index) => (
                    <div key={item} className="flex gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                        {index + 1}
                      </div>
                      <p className="leading-6">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamFrictionMapTab({ company }: TeamFrictionMapTabProps) {
  const [view, setView] = useState<ViewMode>('map');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [pairs, setPairs] = useState<RelevantPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<RelevantPair | null>(null);
  const [showAllPairs, setShowAllPairs] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberAId, setSelectedMemberAId] = useState<string | null>(null);
  const [selectedMemberBId, setSelectedMemberBId] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>(ALL_DEPARTMENTS_VALUE);

  const loadMembers = async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const [membersResponse, rolesResponse, departmentsResponse] = await Promise.all([
        supabase
          .from('company_users')
          .select(`
            id,
            user_id,
            email,
            full_name,
            role,
            status,
            job_role,
            assessment_result_id,
            assessment_results(results, assessment_type)
          `)
          .eq('company_id', company.id)
          .in('status', ['active', 'invited'])
          .order('created_at', { ascending: true }),
        supabase
          .from('company_roles')
          .select('name, department_id')
          .eq('company_id', company.id),
        supabase
          .from('company_departments')
          .select('id, name')
          .eq('company_id', company.id),
      ]);

      const { data, error: fetchError } = membersResponse;
      const { data: roleRows, error: rolesError } = rolesResponse;
      const { data: departmentRows, error: departmentsError } = departmentsResponse;

      if (fetchError) throw fetchError;
      if (rolesError && rolesError.code !== 'PGRST205' && rolesError.code !== '42P01') throw rolesError;
      if (departmentsError && departmentsError.code !== 'PGRST205' && departmentsError.code !== '42P01') throw departmentsError;

      const departmentById = new Map<string, string>((departmentRows || []).map((department) => [department.id, department.name]));
      const roleDepartmentByName = new Map<string, string | null>(
        (roleRows || []).map((role) => [role.name.trim().toLowerCase(), role.department_id || null]),
      );

      const mappedMembers: CompanyMember[] = (data ?? []).map((member: any) => {
        const normalizedRoleName = member.job_role?.trim().toLowerCase();
        const departmentId = normalizedRoleName ? roleDepartmentByName.get(normalizedRoleName) ?? null : null;

        return {
          id: member.id,
          userId: member.user_id ?? null,
          name: member.full_name || member.email?.split('@')[0] || 'Unknown user',
          email: member.email || '',
          role: member.role || 'employee',
          jobRole: member.job_role || null,
          departmentId,
          departmentName: departmentId ? departmentById.get(departmentId) ?? null : null,
          roleColor: member.assessment_results?.results
            ? resolveRoleColor(member.assessment_results.results)
            : null,
        };
      });

      setMembers(mappedMembers);
      setPairs(buildRelevantPairs(mappedMembers));
      setShowAllPairs(false);
    } catch (loadError: any) {
      console.error('Failed to load Team Friction Map members', loadError);
      setError(loadError?.message || 'Unable to load team data right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setSelectedPair(null);
    setSelectedMemberAId(null);
    setSelectedMemberBId(null);
    void loadMembers(false);
  }, [company.id]);

  const departmentOptions = Array.from(
    new Map(
      members
        .filter((member) => member.departmentId && member.departmentName)
        .map((member) => [member.departmentId as string, member.departmentName as string]),
    ).entries(),
  )
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const departmentFilteredMembers = members.filter((member) => {
    if (departmentFilter === ALL_DEPARTMENTS_VALUE) return true;
    if (departmentFilter === UNASSIGNED_DEPARTMENTS_VALUE) return !member.departmentId;
    return member.departmentId === departmentFilter;
  });

  const memberIdSet = new Set(departmentFilteredMembers.map((member) => member.id));
  const departmentFilteredPairs = pairs.filter(
    (pair) => memberIdSet.has(pair.a.id) && memberIdSet.has(pair.b.id),
  );

  const assessedMembers = departmentFilteredMembers.filter((member) => Boolean(member.roleColor));
  const unassessedMembers = departmentFilteredMembers.filter((member) => !member.roleColor);
  const highRiskPairs = departmentFilteredPairs.filter((pair) => pair.risk === 'high');
  const mediumRiskPairs = departmentFilteredPairs.filter((pair) => pair.risk === 'medium');
  const visiblePairs = showAllPairs ? departmentFilteredPairs : departmentFilteredPairs.slice(0, 50);

  const composition = {
    Red: 0,
    Yellow: 0,
    Green: 0,
    Blue: 0,
  };

  assessedMembers.forEach((member) => {
    if (!member.roleColor) return;
    composition[member.roleColor] += 1;
  });

  const maxComposition = Math.max(...Object.values(composition), 1);
  const patternCounts = departmentFilteredPairs.reduce<Record<string, { count: number; risk: PairRisk }>>((accumulator, pair) => {
    if (!pair.clash) return accumulator;
    const existing = accumulator[pair.clash.name];
    if (existing) {
      existing.count += 1;
      return accumulator;
    }

    accumulator[pair.clash.name] = {
      count: 1,
      risk: pair.clash.risk,
    };
    return accumulator;
  }, {});
  const sortedPatterns = Object.entries(patternCounts).sort((left, right) => right[1].count - left[1].count);
  const maxPatternCount = Math.max(...sortedPatterns.map(([, value]) => value.count), 1);

  const filteredMembers = departmentFilteredMembers.filter((member) => {
    if (!memberSearch.trim()) return true;
    const query = memberSearch.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      (member.jobRole || '').toLowerCase().includes(query)
    );
  });

  const selectedMemberA = departmentFilteredMembers.find((member) => member.id === selectedMemberAId) || null;
  const selectedMemberB = departmentFilteredMembers.find((member) => member.id === selectedMemberBId) || null;
  const selectedAnalysisPair = selectedMemberA && selectedMemberB && selectedMemberA.id !== selectedMemberB.id
    ? buildPairFromMembers(selectedMemberA, selectedMemberB)
    : null;

  const handleRefresh = async () => {
    await loadMembers(true);
  };

  useEffect(() => {
    if (selectedMemberAId && !memberIdSet.has(selectedMemberAId)) {
      setSelectedMemberAId(null);
    }
    if (selectedMemberBId && !memberIdSet.has(selectedMemberBId)) {
      setSelectedMemberBId(null);
    }
  }, [departmentFilter, memberIdSet, selectedMemberAId, selectedMemberBId]);

  const handleSelectMember = (member: CompanyMember) => {
    if (selectedMemberAId === member.id) {
      setSelectedMemberAId(null);
      return;
    }

    if (selectedMemberBId === member.id) {
      setSelectedMemberBId(null);
      return;
    }

    if (!selectedMemberAId) {
      setSelectedMemberAId(member.id);
      return;
    }

    if (!selectedMemberBId) {
      setSelectedMemberBId(member.id);
      return;
    }

    setSelectedMemberAId(selectedMemberBId);
    setSelectedMemberBId(member.id);
  };
  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Team Friction Map couldn't load</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void loadMembers(false)}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-semibold">
                  Business Platform
                </Badge>
                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-semibold">
                  Team Friction Map
                </Badge>
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">Team Friction Map</CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm leading-6">
                  Surface where RoleColor combinations are most likely to create team drag, misreads, or delivery friction.
                </CardDescription>
              </div>
            </div>

            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh data
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-[280px,1fr] md:items-end">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Department filter</p>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_DEPARTMENTS_VALUE}>All departments</SelectItem>
                  <SelectItem value={UNASSIGNED_DEPARTMENTS_VALUE}>Unassigned</SelectItem>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Applies to both Team Friction Map pairs and Pair Analyzer teammates.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Assessed teammates"
              value={assessedMembers.length}
              caption={`${departmentFilteredMembers.length} total people in current scope`}
            />
            <MetricCard
              label="Relevant pairs"
              value={departmentFilteredPairs.length}
              caption="Filtered to likely collaboration pairs when job roles are present"
            />
            <MetricCard
              label="High-risk pairs"
              value={highRiskPairs.length}
              caption="Pairs with the strongest friction signature"
            />
            <MetricCard
              label="Medium-risk pairs"
              value={mediumRiskPairs.length}
              caption="Pairs worth coaching before tension compounds"
            />
          </div>

          {unassessedMembers.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Some teammates are missing RoleColor data.</p>
                  <p className="text-amber-800">
                    {unassessedMembers.map((member) => member.name.split(' ')[0]).join(', ')} still need to complete an assessment for the map to include them.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 lg:grid-cols-3">
            {VIEW_OPTIONS.map(({ key, label, description, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors',
                  view === key
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border/70 bg-background hover:bg-muted/40',
                )}
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', view === key ? 'text-background' : 'text-muted-foreground')} />
                <div className="space-y-1">
                  <p className="font-medium">{label}</p>
                  <p className={cn('text-sm', view === key ? 'text-background/80' : 'text-muted-foreground')}>
                    {description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {view === 'map' ? (
        <div className="space-y-6">
          {departmentFilteredPairs.length === 0 ? (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">No relevant pairs found yet</CardTitle>
                <CardDescription>
                  Once teammates complete their assessments, the Team Friction Map will start surfacing pair-level patterns here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Risk breakdown</CardTitle>
                    <CardDescription>Where the current collaboration load sits across the team</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(['high', 'medium', 'low'] as PairRisk[]).map((risk) => {
                      const count = departmentFilteredPairs.filter((pair) => pair.risk === risk).length;
                      const width = departmentFilteredPairs.length > 0 ? (count / departmentFilteredPairs.length) * 100 : 0;

                      return (
                        <div key={risk} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <RiskBadge risk={risk} />
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-2 rounded-full',
                                risk === 'high' ? 'bg-red-500' : risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500',
                              )}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Team composition</CardTitle>
                    <CardDescription>Assessed teammates by dominant RoleColor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(Object.keys(composition) as Array<keyof typeof composition>).map((color) => (
                      <div key={color} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ROLE_COLOR_META[color].hex }} />
                            <span className="font-medium">{color}</span>
                            <span className="text-muted-foreground">{ROLE_COLOR_META[color].label}</span>
                          </div>
                          <span>{composition[color]}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(composition[color] / maxComposition) * 100}%`,
                              backgroundColor: ROLE_COLOR_META[color].hex,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Friction patterns</CardTitle>
                  <CardDescription>The most common RoleColor clashes showing up in relevant pairs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sortedPatterns.length > 0 ? sortedPatterns.map(([name, value]) => (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{name}</span>
                          <RiskBadge risk={value.risk} />
                        </div>
                        <span>{value.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            value.risk === 'high'
                              ? 'bg-red-500'
                              : value.risk === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500',
                          )}
                          style={{ width: `${(value.count / maxPatternCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">
                      Most current pairs look complementary or same-style rather than following a named friction pattern.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">Relevant pairs</CardTitle>
                      <CardDescription>
                        Click any pair to open a coaching playbook
                      </CardDescription>
                    </div>

                    {departmentFilteredPairs.length > 50 ? (
                      <Button variant="outline" onClick={() => setShowAllPairs((current) => !current)}>
                        {showAllPairs ? 'Show top 50' : `Show all ${departmentFilteredPairs.length}`}
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visiblePairs.map((pair) => (
                    <button
                      key={pair.id}
                      type="button"
                      onClick={() => setSelectedPair(pair)}
                      className="flex w-full flex-col gap-4 rounded-2xl border border-border/70 bg-background px-4 py-4 text-left transition-colors hover:bg-muted/30 md:flex-row md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-3">
                          <MemberAvatar member={pair.a} className="border-2 border-background" />
                          <MemberAvatar member={pair.b} className="border-2 border-background" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{pair.a.name} and {pair.b.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {[pair.a.jobRole, pair.b.jobRole].filter(Boolean).join(' and ') || 'Assessed pair'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 items-center justify-between gap-3 md:justify-end">
                        <div className="max-w-md text-sm text-muted-foreground md:text-right">
                          {pair.clash?.summary || pair.collabReason || 'Complementary styles with no major friction flag'}
                        </div>
                        <div className="flex items-center gap-3">
                          <RiskBadge risk={pair.risk} />
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : null}

      {view === 'pairs' ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Selected pair</CardTitle>
              <CardDescription>Choose any two teammates to compare how they are likely to work together</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {[
                  { label: 'Person A', member: selectedMemberA, clear: () => setSelectedMemberAId(null) },
                  { label: 'Person B', member: selectedMemberB, clear: () => setSelectedMemberBId(null) },
                ].map((slot) => (
                  <div
                    key={slot.label}
                    className="flex min-h-[84px] items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-4"
                  >
                    {slot.member ? (
                      <>
                        <MemberAvatar member={slot.member} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-medium">{slot.member.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {slot.member.jobRole || slot.member.email}
                          </p>
                          {slot.member.roleColor ? (
                            <p className="text-xs font-medium" style={{ color: ROLE_COLOR_META[slot.member.roleColor].text }}>
                              {slot.member.roleColor} - {ROLE_COLOR_META[slot.member.roleColor].label}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Assessment not completed yet</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={slot.clear}>
                          Clear
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{slot.label}</p>
                        <p>Select a teammate from the list to fill this slot.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedAnalysisPair?.a.roleColor && selectedAnalysisPair?.b.roleColor ? (
                <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge risk={selectedAnalysisPair.risk} />
                    {selectedAnalysisPair.clash ? (
                      <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-semibold">
                        {selectedAnalysisPair.clash.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-semibold">
                        Complementary pairing
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selectedAnalysisPair.clash?.summary || 'This pairing does not show a major named clash pattern, but it still benefits from clear handoffs and decision ownership.'}
                  </p>
                </div>
              ) : null}

              <Button
                className="w-full"
                disabled={!selectedAnalysisPair}
                onClick={() => setSelectedPair(selectedAnalysisPair)}
              >
                Open pair playbook
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Choose teammates</CardTitle>
              <CardDescription>Search by name, role, or email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search teammates"
                  className="pl-9"
                />
              </div>

              <div className="space-y-3">
                {filteredMembers.map((member) => {
                  const isSelectedA = selectedMemberAId === member.id;
                  const isSelectedB = selectedMemberBId === member.id;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectMember(member)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors',
                        isSelectedA || isSelectedB
                          ? 'border-foreground bg-muted'
                          : 'border-border/70 bg-background hover:bg-muted/30',
                      )}
                    >
                      <MemberAvatar member={member} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{member.name}</p>
                          {isSelectedA ? (
                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-semibold">A</Badge>
                          ) : null}
                          {isSelectedB ? (
                            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-semibold">B</Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {member.jobRole || member.email}
                        </p>
                        {member.roleColor ? (
                          <p className="text-xs font-medium" style={{ color: ROLE_COLOR_META[member.roleColor].text }}>
                            {member.roleColor} - {ROLE_COLOR_META[member.roleColor].label}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Assessment not completed yet</p>
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                    No teammates matched that search.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <PairDetailDialog
        pair={selectedPair}
        open={Boolean(selectedPair)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPair(null);
          }
        }}
      />
    </div>
  );
}
